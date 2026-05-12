import { Injectable, signal, computed, inject } from '@angular/core';
import { Fighter, Ability, BattleLogEntry, GamePhase, StatusEffect } from '../models/game.models';
import { FACTIONS } from '../data/factions.data';
import { AuthService } from './auth.service';
import { MatchService } from './match.service';

@Injectable({ providedIn: 'root' })
export class GameService {

  // ── Phase & Auth ─────────────────────────────────────────────
  phase        = signal<GamePhase>('login');
  loggedInUser = signal<string | null>(null);
  isMultiplayer = signal<boolean>(false);

  private authService = inject(AuthService);
  private matchService = inject(MatchService);

  // ── Selection ────────────────────────────────────────────────
  selectedFactionIds = signal<string[]>([]);

  // ── Battle state ─────────────────────────────────────────────
  fighters       = signal<Fighter[]>([]);
  turnOrder      = signal<number[]>([]);
  currentTurnIdx = signal<number>(0);
  battleLog      = signal<BattleLogEntry[]>([]);
  turnNumber     = signal<number>(1);
  winner         = signal<string | null>(null);

  readonly factions = FACTIONS;

  // ── Derived ──────────────────────────────────────────────────
  currentFighterIndex = computed(() => this.turnOrder()[this.currentTurnIdx()]);
  currentFighter      = computed(() => this.fighters()[this.currentFighterIndex()]);
  aliveFighters       = computed(() => this.fighters().filter(f => f.alive));
  isMyTurn            = computed(() => !this.isMultiplayer() || this.currentFighter().playerName === this.loggedInUser());

  // ── Auth ─────────────────────────────────────────────────────
  onLoginSuccess(username: string) {
    this.loggedInUser.set(username);
    this.phase.set('lobby');
  }

  // ── Faction toggle ───────────────────────────────────────────
  toggleFaction(factionId: string) {
    const cur = this.selectedFactionIds();
    if (cur.includes(factionId)) {
      this.selectedFactionIds.set(cur.filter(id => id !== factionId));
    } else if (cur.length < 8) {
      this.selectedFactionIds.set([...cur, factionId]);
    }
  }

  // ── Build fighter from template ───────────────────────────────
  private buildFighter(factionId: string, playerName?: string): Fighter {
    const f = FACTIONS.find(x => x.id === factionId)!;
    return {
      factionId:      f.id,
      playerName:     playerName ?? this.loggedInUser() ?? 'Player',
      name:           f.name,
      hp:             f.baseHp,
      maxHp:          f.baseHp,
      missiles:       f.baseMissiles,
      maxMissiles:    f.baseMissiles,
      armor:          f.baseArmor,
      alive:          true,
      shieldHp:       0,
      statusEffects:  [],
      color:          f.color,
      gradientFrom:   f.gradientFrom,
      gradientTo:     f.gradientTo,
      svgIcon:        f.svgIcon,
      lore:           f.lore,
      abilities:      f.abilities.map(a => ({ ...a, currentCooldown: 0 })),
      passive:        { ...f.passive },
    };
  }

  // ── Start battle ──────────────────────────────────────────────
  startBattle(ids: string[], externalOrder?: number[], names?: string[]) {
    const fighters = ids.map((id, i) => this.buildFighter(id, names ? names[i] : undefined));
    let order = externalOrder ? [...externalOrder] : fighters.map((_, i) => i);

    if (!externalOrder) {
      // Fisher-Yates shuffle for random turn order
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
    }

    this.fighters.set(fighters);
    this.turnOrder.set(order);
    this.currentTurnIdx.set(0);
    this.battleLog.set([]);
    this.turnNumber.set(1);
    this.winner.set(null);
    this.phase.set('battle');

    this.addLog({
      turn: 0, actorName: 'Arena', targetName: '', abilityName: 'Inicio de Batalla',
      abilityIcon: '🚀', type: 'status',
      message: `🚀 ¡La batalla comienza! Orden de turnos: ${order.map(i => fighters[i].name).join(' → ')}`,
    });
  }

  // ── Use ability ───────────────────────────────────────────────
  useAbility(abilityId: string, targetIdx: number, extra?: any) {
    console.log(`Ejecutando habilidad: ${abilityId} sobre objetivo ${targetIdx}`);
    const fighters  = [...this.fighters()];
    const actorIdx  = this.currentFighterIndex();
    
    const actor     = { ...fighters[actorIdx], abilities: [...fighters[actorIdx].abilities] };
    const abilityIdx = actor.abilities.findIndex(a => a.id === abilityId);
    if (abilityIdx === -1) return;
    
    const ability = { ...actor.abilities[abilityIdx] };

    if (ability.currentCooldown > 0 || actor.missiles < ability.missileCost) return;

    let target  = { ...fighters[targetIdx] };
    let logMsg  = '';
    let logVal: number | undefined;
    let logType: BattleLogEntry['type'] = ability.type;

    // ── PASSIVE: Storm Legion (Overload: 15% chance no cost) ──
    const isStormLegion = actor.factionId === 'storm_legion';
    const costFree = extra?.costFree ?? (isStormLegion && Math.random() < 0.15);
    
    // Consume missiles
    if (!costFree) {
      actor.missiles = Math.max(0, actor.missiles - ability.missileCost);
    } else {
      this.addLog({
        turn: this.turnNumber(), actorName: actor.name, targetName: '',
        abilityName: 'Sobrecarga', abilityIcon: '🔋', type: 'status',
        message: `🔋 ¡Pasiva: Sobrecarga! La habilidad no consumió misiles.`,
      });
    }

    ability.currentCooldown = ability.cooldown;

    // ── PASSIVE: Shadow Cult (Shadow Veil: +10 shield on use) ──
    if (actor.factionId === 'shadow_cult') {
      actor.shieldHp += 10;
    }

    switch (ability.type) {
      case 'missile':
      case 'snipe':
      case 'burst': {
        let armorReduction = ability.type === 'snipe' ? 0 : target.armor;
        
        // ── PASSIVE: Void Heralds (Entropy: ignore 5 armor) ──
        if (actor.factionId === 'void_heralds') {
          armorReduction = Math.max(0, armorReduction - 5);
        }

        let rawDmg = (ability.damage ?? 0) - armorReduction;

        // ── PASSIVE: Ember Circle (Post-Combustion: +10 dmg) ──
        if (actor.factionId === 'ember_circle' && (ability.type === 'missile' || ability.type === 'burst')) {
          rawDmg += 10;
        }

        const shieldAbsorb = Math.min(target.shieldHp, rawDmg);
        target.shieldHp -= shieldAbsorb;
        const realDmg = Math.max(1, rawDmg - shieldAbsorb);
        
        // ── PASSIVE: Radiant Order (Radiance: 10% reduction) ──
        const finalDmg = target.factionId === 'radiant_order' ? Math.floor(realDmg * 0.9) : realDmg;

        target.hp = Math.max(0, target.hp - finalDmg);
        logVal = finalDmg;
        logMsg = `${actor.name} usó ${ability.name} sobre ${target.name} causando ${finalDmg} de daño!`;
        break;
      }
      case 'aoe': {
        const realDmg = ability.aoeDamage ?? ability.damage ?? 100;
        target.hp = Math.max(0, target.hp - realDmg);
        logVal = realDmg;
        logMsg = `${actor.name} detonó ${ability.name} sobre ${target.name} causando ${realDmg} de daño (armadura ignorada)!`;
        break;
      }

      case 'drain': {
        const rawDmg  = (ability.damage ?? 0) - target.armor;
        const shieldAbsorb = Math.min(target.shieldHp, rawDmg);
        target.shieldHp -= shieldAbsorb;
        const realDmg = Math.max(1, rawDmg - shieldAbsorb);
        target.hp = Math.max(0, target.hp - realDmg);
        const heal = ability.healHp ?? 0;
        actor.hp = Math.min(actor.maxHp, actor.hp + heal);
        logVal = realDmg;
        logMsg = `${actor.name} usó ${ability.name}: ${realDmg} de daño a ${target.name}, ¡recuperó ${heal} HP!`;
        break;
      }

      case 'shield': {
        actor.shieldHp += ability.shieldAmount ?? 0;
        logMsg = `${actor.name} desplegó ${ability.name}: ¡+${ability.shieldAmount} de escudo!`;
        break;
      }

      case 'reload': {
        if (ability.reloadMissiles) {
          actor.missiles = Math.min(actor.maxMissiles, actor.missiles + ability.reloadMissiles);
        }
        if (ability.healHp) {
          actor.hp = Math.min(actor.maxHp, actor.hp + ability.healHp);
        }
        logMsg = `${actor.name} usó ${ability.name}: ` +
          (ability.reloadMissiles ? `+${ability.reloadMissiles} misiles ` : '') +
          (ability.healHp ? `+${ability.healHp} HP` : '');
        break;
      }
    }

    // Check death
    if (target.hp <= 0 && target.factionId !== actor.factionId) {
      target.alive = false;
      this.addLog({
        turn: this.turnNumber(), actorName: target.name, targetName: '',
        abilityName: 'Destruido', abilityIcon: '💥', type: 'death',
        message: `💥 ¡${target.name} ha sido destruido!`,
      });

      // ── PASSIVE: Bone Covenant (Soul Harvest: +100 HP on kill) ──
      if (actor.factionId === 'bone_covenant') {
        actor.hp = Math.min(actor.maxHp, actor.hp + 100);
        this.addLog({
          turn: this.turnNumber(), actorName: actor.name, targetName: '',
          abilityName: 'Cosecha de Almas', abilityIcon: '⚰️', type: 'status',
          message: `⚰️ ¡Pasiva: Cosecha! ${actor.name} recupera 100 HP.`,
        });
      }
    }

    // Commit updated ability cooldown
    actor.abilities[abilityIdx] = ability;

    fighters[actorIdx] = actor;
    fighters[targetIdx] = target;
    this.fighters.set(fighters);

    this.addLog({
      turn: this.turnNumber(),
      actorName: actor.name,
      targetName: target.name,
      abilityName: ability.name,
      abilityIcon: ability.icon,
      type: logType,
      message: logMsg,
      value: logVal,
    });

    this.advanceTurn();
  }

  // ── Advance turn ─────────────────────────────────────────────
  private advanceTurn() {
    const fighters = [...this.fighters()];
    const actorIdx = this.currentFighterIndex();
    const actor = { ...fighters[actorIdx] };

    // ── PASSIVE: Iron Vanguard (Reactive Armor: +10 HP at end of turn) ──
    if (actor.factionId === 'iron_vanguard' && actor.alive) {
      actor.hp = Math.min(actor.maxHp, actor.hp + 10);
      this.addLog({
        turn: this.turnNumber(), actorName: actor.name, targetName: '',
        abilityName: 'Blindaje Reactivo', abilityIcon: '🛠️', type: 'status',
        message: `🛠️ ¡Pasiva: Blindaje! ${actor.name} reparó 10 HP.`,
      });
    }
    fighters[actorIdx] = actor;

    const alive = fighters.filter(f => f.alive);
    if (alive.length <= 1) {
      this.winner.set(alive[0]?.name || null);
      this.phase.set('gameover');
      this.fighters.set(fighters);
      this.saveMatchResults();
      return;
    }

    // Find next alive fighter in order
    let nextIdx = (this.currentTurnIdx() + 1) % this.turnOrder().length;
    let loops   = 0;
    while (!fighters[this.turnOrder()[nextIdx]].alive) {
      nextIdx = (nextIdx + 1) % this.turnOrder().length;
      if (++loops > this.turnOrder().length) break;
    }

    const nextFighterIdx = this.turnOrder()[nextIdx];
    const nf = { ...fighters[nextFighterIdx] };

    // Reduce cooldowns
    nf.abilities = nf.abilities.map(a => ({
      ...a, currentCooldown: Math.max(0, a.currentCooldown - 1)
    }));

    // ── PASSIVE: Thorn Wardens (Photosynthesis: +3 missiles at start of turn) ──
    if (nf.factionId === 'thorn_wardens' && nf.alive) {
      nf.missiles = Math.min(nf.maxMissiles, nf.missiles + 3);
      this.addLog({
        turn: this.turnNumber(), actorName: nf.name, targetName: '',
        abilityName: 'Fotosíntesis', abilityIcon: '🍃', type: 'status',
        message: `🍃 ¡Pasiva: Fotosíntesis! +3 misiles para ${nf.name}.`,
      });
    }

    fighters[nextFighterIdx] = nf;
    this.fighters.set(fighters);
    this.currentTurnIdx.set(nextIdx);
    this.turnNumber.update(t => t + 1);
  }

  addLogDebug(msg: string) {
    this.addLog({
      turn: this.turnNumber(), actorName: 'DEBUG', targetName: '', abilityName: 'Debug',
      abilityIcon: '🔧', type: 'status', message: msg
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  private addLog(entry: BattleLogEntry) {
    this.battleLog.update(log => [entry, ...log].slice(0, 60));
  }

  /** Returns valid target indices for the given ability */
  getValidTargets(ability: Ability): number[] {
    const selfOnly = ability.type === 'shield' || ability.type === 'reload';
    if (selfOnly) return [this.currentFighterIndex()];
    return this.fighters()
      .map((f, i) => ({ f, i }))
      .filter(({ f, i }) => f.alive && i !== this.currentFighterIndex())
      .map(({ i }) => i);
  }

  isSelfAbility(ability: Ability): boolean {
    return ability.type === 'shield' || ability.type === 'reload';
  }

  surrender() { this.applySurrender(this.currentFighterIndex()); }

  applySurrender(actorIdx: number) {
    const fighters = [...this.fighters()];
    if (!fighters[actorIdx]) return;

    fighters[actorIdx] = { ...fighters[actorIdx], alive: false, surrendered: true };
    this.fighters.set(fighters);

    this.addLog({
      turn: this.turnNumber(), actorName: fighters[actorIdx].name, targetName: '',
      abilityName: 'Rendición', abilityIcon: '🏳️', type: 'status',
      message: `🏳️ ${fighters[actorIdx].name} se ha rendido.`,
    });

    this.advanceTurn();
  }

  resetGame() {
    this.selectedFactionIds.set([]);
    this.fighters.set([]);
    this.battleLog.set([]);
    this.winner.set(null);
    this.phase.set('lobby');
  }

  logout() {
    this.loggedInUser.set(null);
    this.selectedFactionIds.set([]);
    this.fighters.set([]);
    this.battleLog.set([]);
    this.winner.set(null);
    this.phase.set('login');
  }

  // ── Persistence ──────────────────────────────────────────────
  private saveMatchResults() {
    const user = this.authService.currentUser();
    if (!user || !user.id) return;

    // Mapa de IDs de facción (coincide con los seeds de MySQL)
    const factionIdMap: Record<string, number> = {
      'iron_vanguard': 1, 'shadow_cult': 2, 'ember_circle': 3, 'thorn_wardens': 4,
      'void_heralds': 5, 'storm_legion': 6, 'bone_covenant': 7, 'radiant_order': 8
    };

    // Solo incluir participantes con usuario real en BD.
    // En partidas locales (vs IA), el oponente no tiene usuario registrado,
    // así que se filtran y solo se guarda el jugador autenticado.
    const participantesReales = this.fighters()
      .filter(f => f.playerName === this.loggedInUser())
      .map(f => ({
        usuario: { id: user.id! },
        faccion: { id: factionIdMap[f.factionId] || 1 },
        vida: f.hp,
        posicion: f.name === this.winner() ? 1 : 2
      }));

    if (participantesReales.length === 0) {
      console.warn('No se encontraron participantes reales para guardar.');
      return;
    }

    const partidaData = {
      estado: 'FINALIZADO',
      numeroRonda: this.turnNumber(),
      participantes: participantesReales
    };

    console.log('Enviando resultados de la partida al backend...', partidaData);
    this.matchService.guardarPartida(partidaData).subscribe({
      next: (res) => console.log('✅ Partida guardada con éxito:', res),
      error: (err) => console.error('❌ Error al guardar partida:', err)
    });
  }
}
