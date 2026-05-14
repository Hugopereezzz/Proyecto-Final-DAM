// src/app/services/game.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  Fighter, PlayerPlan, RoundResult, BattleLogEntry, GamePhase, AttackAssignment
} from '../models/game.models';
import { FACTIONS } from '../data/factions.data';
import { AuthService } from './auth.service';
import { SocketService } from './socket.service';

const MISSILES_PER_ROUND = 50;
const PLANNING_SECONDS  = 30;
const BASE_HP           = 500;

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly auth          = inject(AuthService);
  private readonly socketService = inject(SocketService);
  private readonly router        = inject(Router);

  constructor() {
    const user = this.auth.currentUser();
    if (user) {
      this.loggedInUser.set(user.nombreUsuario);
      this.phase.set('lobby');
    }
  }

  // ── Phase & Auth ──────────────────────────────────────────────────
  phase        = signal<GamePhase>('login');
  loggedInUser = signal<string | null>(null);
  isMultiplayer = signal<boolean>(false);
  multiplayerPlayers = signal<any[]>([]);

  // ── Selection ────────────────────────────────────────────────────
  selectedFactionIds = signal<string[]>([]);

  // ── Battle state ─────────────────────────────────────────────────
  fighters   = signal<Fighter[]>([]);
  roundNumber = signal<number>(1);
  battleLog  = signal<BattleLogEntry[]>([]);
  winner     = signal<string | null>(null);

  // ── Planning state ───────────────────────────────────────────────
  /** Plan of each player (indexed by fighter index). null = not yet confirmed. */
  playerPlans = signal<(PlayerPlan | null)[]>([]);
  planningTimeLeft = signal<number>(PLANNING_SECONDS);
  myPlan = signal<PlayerPlan | null>(null);        // local player's draft plan

  private _planningTimer: any = null;

  readonly factions = FACTIONS;

  // ── Derived ──────────────────────────────────────────────────────
  aliveFighters = computed(() => this.fighters().filter(f => f.alive));

  /**
   * Index of the local player among fighters (matches playerName).
   * Returns -1 in single-player / host mode.
   */
  myFighterIdx = computed(() =>
    this.fighters().findIndex(f => f.playerName === this.loggedInUser())
  );

  // ── Auth ─────────────────────────────────────────────────────────
  onLoginSuccess(username: string): void {
    this.loggedInUser.set(username);
    this.phase.set('lobby');
    this.router.navigate(['/lobby']);
  }

  // ── Faction toggle (used in selection screen) ────────────────────
  toggleFaction(factionId: string) {
    const cur = this.selectedFactionIds();
    if (cur.includes(factionId)) {
      this.selectedFactionIds.set(cur.filter(id => id !== factionId));
    } else if (cur.length < 8) {
      this.selectedFactionIds.set([...cur, factionId]);
    }
  }

  // ── Build fighter ────────────────────────────────────────────────
  private buildFighter(factionId: string, playerName?: string): Fighter {
    const f = FACTIONS.find(x => x.id === factionId)!;
    return {
      factionId:    f.id,
      playerName:   playerName ?? this.loggedInUser() ?? 'Player',
      name:         f.name,
      hp:           BASE_HP,
      maxHp:        BASE_HP,
      missiles:     MISSILES_PER_ROUND,
      shieldHp:     0,
      alive:        true,
      planConfirmed: false,
      color:        f.color,
      gradientFrom: f.gradientFrom,
      gradientTo:   f.gradientTo,
      svgIcon:      f.svgIcon,
      lore:         f.lore,
    };
  }

  // ── Start battle ─────────────────────────────────────────────────
  startBattle(ids: string[], _unusedOrder?: number[], names?: string[]): void {
    const fighters = ids.map((id, i) => this.buildFighter(id, names ? names[i] : undefined));
    this.fighters.set(fighters);
    this.roundNumber.set(1);
    this.battleLog.set([]);
    this.winner.set(null);
    this.phase.set('planning');

    this.addLog({
      round: 0, actorName: 'Arena', targetName: '',
      icon: '🚀', type: 'status',
      message: `🚀 ¡La batalla comienza! ${fighters.length} combatientes. Cada ronda: 50 misiles.`,
    });

    this.router.navigate(['/batalla']);
    this._startPlanningPhase();
  }

  // ── Planning phase ────────────────────────────────────────────────
  private _startPlanningPhase() {
    this.phase.set('planning');
    this.planningTimeLeft.set(PLANNING_SECONDS);
    this.myPlan.set(null);

    // Reset confirmed flags
    this.fighters.update(fs => fs.map(f => ({
      ...f,
      missiles: MISSILES_PER_ROUND,
      shieldHp: 0,
      planConfirmed: false,
    })));
    this.playerPlans.set(this.fighters().map(() => null));

    this.addLog({
      round: this.roundNumber(), actorName: 'Arena', targetName: '',
      icon: '📋', type: 'round_start',
      message: `📋 RONDA ${this.roundNumber()} — Fase de planificación. ¡30 segundos!`,
    });

    // Countdown
    clearInterval(this._planningTimer);
    this._planningTimer = setInterval(() => {
      const t = this.planningTimeLeft() - 1;
      this.planningTimeLeft.set(t);
      if (t <= 0) {
        clearInterval(this._planningTimer);
        this._resolveRound();
      }
    }, 1000);
  }

  // ── Submit a player's plan ────────────────────────────────────────
  /**
   * Called when a player (local or remote) confirms their plan.
   * @param actorIdx Fighter index
   * @param plan     The confirmed plan
   */
  submitPlan(actorIdx: number, plan: PlayerPlan) {
    const plans = [...this.playerPlans()];
    plans[actorIdx] = plan;
    this.playerPlans.set(plans);

    // Mark confirmed on fighter card
    this.fighters.update(fs => {
      const copy = [...fs];
      copy[actorIdx] = { ...copy[actorIdx], planConfirmed: true };
      return copy;
    });

    this.addLog({
      round: this.roundNumber(), actorName: this.fighters()[actorIdx].name, targetName: '',
      icon: '✅', type: 'status',
      message: `✅ ${this.fighters()[actorIdx].name} ha confirmado su plan.`,
    });

    // If ALL alive players confirmed → resolve immediately
    const alive = this.fighters().filter(f => f.alive);
    const allConfirmed = alive.every((_, i) => {
      const realIdx = this.fighters().indexOf(alive[i]);
      return plans[realIdx] !== null;
    });
    if (allConfirmed) {
      clearInterval(this._planningTimer);
      // In multiplayer, the server will send 'ronda-resuelta'.
      // In single player, we resolve immediately.
      if (!this.isMultiplayer()) {
        this._resolveRound();
      }
    }
  }

  // ── Resolve round ─────────────────────────────────────────────────
  /**
   * Public method for multiplayer resolution.
   * @param remotePlans List of { actorIdx, plan }
   * @param seed Random seed for synchronized shuffling
   */
  resolveMultiplayerRound(remotePlans: { actorIdx: number, plan: PlayerPlan }[], seed: number) {
    clearInterval(this._planningTimer);
    
    // Update local plans state with the official ones from server
    const plans = [...this.playerPlans()];
    remotePlans.forEach(rp => {
      plans[rp.actorIdx] = rp.plan;
    });
    this.playerPlans.set(plans);
    
    this._resolveRound(seed);
  }

  private _resolveRound(seed?: number) {
    this.phase.set('resolving');

    const fighters = [...this.fighters()];
    const plans    = this.playerPlans();

    // Build a flat list of all attack events
    type AttackEvent = { actorIdx: number; targetIdx: number; missiles: number };
    const events: AttackEvent[] = [];

    for (let i = 0; i < fighters.length; i++) {
      const plan = plans[i];
      if (!plan || !fighters[i].alive) continue;

      for (const atk of plan.attacks) {
        if (atk.missiles > 0 && fighters[atk.targetIdx]?.alive) {
          events.push({ actorIdx: i, targetIdx: atk.targetIdx, missiles: atk.missiles });
        }
      }
    }

    // Shuffle for random priority
    // Use the seed if provided (multiplayer) to ensure same order for everyone
    const random = seed !== undefined ? this._seededRandom(seed) : Math.random;
    
    for (let i = events.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [events[i], events[j]] = [events[j], events[i]];
    }

    // Apply shield points first
    for (let i = 0; i < fighters.length; i++) {
      const plan = plans[i];
      if (!plan || !fighters[i].alive) continue;
      const shieldPts = Math.floor(plan.shieldMissiles / 2);
      fighters[i] = { ...fighters[i], shieldHp: shieldPts };
      if (shieldPts > 0) {
        this.addLog({
          round: this.roundNumber(), actorName: fighters[i].name, targetName: '',
          icon: '🛡️', type: 'shield',
          message: `🛡️ ${fighters[i].name} desplegó ${shieldPts} de escudo (${plan.shieldMissiles} misiles).`,
          value: shieldPts,
        });
      }
    }

    // Apply attacks sequentially in shuffled order
    for (const ev of events) {
      const actor  = fighters[ev.actorIdx];
      const target = fighters[ev.targetIdx];
      if (!actor.alive || !target.alive) continue;

      const incomingDmg   = ev.missiles;              // 1 missile = 1 damage
      const shieldAbsorb  = Math.min(target.shieldHp, incomingDmg);
      const hpDmg         = incomingDmg - shieldAbsorb;
      const shieldBroken  = shieldAbsorb > 0 && target.shieldHp - shieldAbsorb === 0;

      fighters[ev.targetIdx] = {
        ...target,
        shieldHp: Math.max(0, target.shieldHp - shieldAbsorb),
        hp: Math.max(0, target.hp - hpDmg),
      };

      let msg = `💥 ${actor.name} → ${target.name}: ${incomingDmg} de daño`;
      if (shieldAbsorb > 0) msg += ` (${shieldAbsorb} absorbido por escudo, ${hpDmg} a HP)`;
      if (shieldBroken) msg += ' ⚠️ ¡Escudo destruido!';

      this.addLog({
        round: this.roundNumber(), actorName: actor.name, targetName: target.name,
        icon: '🚀', type: 'attack', message: msg,
        value: hpDmg,
      });

        // Death check
        if (fighters[ev.targetIdx].hp <= 0) {
          fighters[ev.targetIdx] = { ...fighters[ev.targetIdx], alive: false };
          
          // Notificar al servidor que este jugador ha muerto para no esperarlo más
          if (this.isMultiplayer()) {
            const deadPlayerName = fighters[ev.targetIdx].playerName;
            if (deadPlayerName === this.loggedInUser()) {
              this.socketService.realizarAccion({ abilityId: 'system_death', targetIdx: ev.targetIdx });
            }
          }

          this.addLog({
          round: this.roundNumber(), actorName: target.name, targetName: '',
          icon: '💥', type: 'death',
          message: `💥 ¡${target.name} ha sido destruido!`,
        });
      }
    }

    this.fighters.set(fighters);
    
    // Check win condition
    const alive = fighters.filter(f => f.alive);
    if (alive.length <= 1) {
      const winnerFighter = alive[0];
      const winnerName    = winnerFighter?.name ?? 'Desconocido';
      const winnerPlayer  = winnerFighter?.playerName ?? null;

      this.winner.set(winnerName);
      this.phase.set('gameover');
      this.router.navigate(['/gameover']);

      // ── GUARDAR ESTADÍSTICAS EN MONGO ──
      const matchData = {
        estado: 'FINALIZADA',
        numeroRonda: this.roundNumber(),
        participantes: fighters.map(f => ({
          nickname: f.playerName,
          faccionNombre: f.name,
          faccionTipo: f.lore?.substring(0, 15) || 'COMBATE',
          vida: f.hp,
          posicion: f.alive ? 1 : 2 // Simplificado: 1 para el ganador, 2 para los demás
        }))
      };
      this.auth.registrarPartida(matchData).subscribe({
        next: () => console.log('Partida registrada en MongoDB.'),
        error: (err) => console.error('Error al registrar partida en Mongo:', err)
      });

      // Update backend if I am the winner
      const myUsername = this.loggedInUser();
      if (myUsername && winnerPlayer === myUsername) {
        this.auth.incrementarVictorias(myUsername).subscribe({
          next: ()    => console.log('Victorias incrementadas con éxito.'),
          error: (err) => console.error('Error al incrementar victorias:', err)
        });
      }
      return;
    }

    // Log summary
    this.addLog({
      round: this.roundNumber(), actorName: 'Arena', targetName: '',
      icon: '📊', type: 'resolve',
      message: `📊 Ronda ${this.roundNumber()} resuelta. Quedan ${alive.length} combatientes.`,
    });

    // Next round after a short delay (so UI can show resolving state)
    setTimeout(() => {
      this.roundNumber.update(r => r + 1);
      this._startPlanningPhase();
    }, 2500);
  }

  /** LCG seeded random generator */
  private _seededRandom(seed: number) {
    let m = 0x80000000, a = 1103515245, c = 12345;
    let state = Math.floor(seed * m);
    return () => {
      state = (a * state + c) % m;
      return state / (m - 1);
    };
  }

  // ── Surrender ────────────────────────────────────────────────────
  applySurrender(actorIdx: number) {
    if (this.phase() === 'gameover') return;
    
    const fighters = [...this.fighters()];
    if (!fighters[actorIdx] || !fighters[actorIdx].alive) return;
    
    fighters[actorIdx] = { ...fighters[actorIdx], alive: false, surrendered: true };
    this.fighters.set(fighters);

    this.addLog({
      round: this.roundNumber(), actorName: fighters[actorIdx].name, targetName: '',
      icon: '🏳️', type: 'status',
      message: `🏳️ ${fighters[actorIdx].name} se ha rendido.`,
    });

    clearInterval(this._planningTimer);

    const alive = fighters.filter(f => f.alive);
    if (alive.length <= 1) {
      const winnerFighter = alive[0];
      const winnerName    = winnerFighter?.name ?? 'Desconocido';
      const winnerPlayer  = winnerFighter?.playerName ?? null;

      this.winner.set(winnerName);
      this.phase.set('gameover');
      this.router.navigate(['/gameover']);

      // ── GUARDAR ESTADÍSTICAS EN MONGO (POR RENDICIÓN) ──
      const matchData = {
        estado: 'FINALIZADA',
        numeroRonda: this.roundNumber(),
        participantes: fighters.map(f => ({
          nickname: f.playerName,
          faccionNombre: f.name,
          faccionTipo: f.lore?.substring(0, 15) || 'COMBATE',
          vida: f.hp,
          posicion: f.alive ? 1 : 2
        }))
      };
      this.auth.registrarPartida(matchData).subscribe();

      // Update backend if I am the winner
      const myUsername = this.loggedInUser();
      if (myUsername && winnerPlayer === myUsername) {
        this.auth.incrementarVictorias(myUsername).subscribe({
          next: ()    => console.log('Victorias incrementadas con éxito.'),
          error: (err) => console.error('Error al incrementar victorias:', err)
        });
      }
    } else {
      // No resolvemos automáticamente si quedan más de 1 jugador vivo.
      // Simplemente dejamos que el resto siga planeando.
      // Si todos los que quedan vivos ya habían confirmado, entonces sí resolvemos.
      const plans = this.playerPlans();
      const allConfirmed = alive.every(a => {
         const idx = this.fighters().indexOf(a);
         return plans[idx] !== null;
      });

      if (allConfirmed) {
        clearInterval(this._planningTimer);
        if (!this.isMultiplayer()) {
          this._resolveRound();
        }
      }
    }
  }

  surrender() { this.applySurrender(this.myFighterIdx()); }

  // ── Helpers ───────────────────────────────────────────────────────
  private addLog(entry: BattleLogEntry) {
    this.battleLog.update(log => [entry, ...log].slice(0, 120));
  }

  addLogDebug(msg: string) {
    this.addLog({
      round: this.roundNumber(), actorName: 'DEBUG', targetName: '',
      icon: '🔧', type: 'status', message: msg,
    });
  }

  resetGame(): void {
    clearInterval(this._planningTimer);
    this.selectedFactionIds.set([]);
    this.fighters.set([]);
    this.battleLog.set([]);
    this.winner.set(null);
    this.myPlan.set(null);
    this.playerPlans.set([]);
    this.phase.set('lobby');
    this.router.navigate(['/lobby']);
  }

  abandonGame(): void {
    this.resetGame();
  }

  logout(): void {
    clearInterval(this._planningTimer);
    this.auth.logout().subscribe(); // Borra el sessionToken en el backend
    this.loggedInUser.set(null);
    this.selectedFactionIds.set([]);
    this.fighters.set([]);
    this.battleLog.set([]);
    this.winner.set(null);
    this.myPlan.set(null);
    this.playerPlans.set([]);
    this.phase.set('login');
    this.router.navigate(['/login']);
  }
}
