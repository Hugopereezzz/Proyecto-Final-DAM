import { Component, inject, signal, computed, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { SocketService } from '../../services/socket.service';
import { FighterCardComponent } from '../fighter-card/fighter-card.component';
import { PlayerPlan, AttackAssignment } from '../../models/game.models';

interface DraftPlan {
  attacks: { [targetIdx: number]: number };
  shieldMissiles: number;
}

@Component({
  selector: 'app-battle-arena',
  standalone: true,
  imports: [CommonModule, FighterCardComponent],
  template: `
    <div class="arena-wrap">

      <!-- ══ Top bar ══ -->
      <div class="top-bar">
        <div class="round-badge">
          <span class="rb-label">RONDA</span>
          <span class="rb-num">{{ game.roundNumber() }}</span>
        </div>

        <div class="timer-track" [class.urgent]="game.planningTimeLeft() <= 10 && game.phase() === 'planning'">
          <div class="timer-fill" [style.width.%]="timerPct()"></div>
          <span class="timer-txt">
            {{ game.phase() === 'planning' ? game.planningTimeLeft() + 's' : '⚔️ RESOLVIENDO' }}
          </span>
        </div>

        <div class="chips-row">
          @for (f of game.fighters(); track f.factionId) {
            <div class="chip" [class.confirmed]="f.planConfirmed" [class.dead]="!f.alive" [style.--c]="f.color">
              <span class="chip-name">{{ f.name }}</span>
              <span class="chip-ico">{{ !f.alive ? '💥' : f.planConfirmed ? '✅' : '⏳' }}</span>
            </div>
          }
        </div>
      </div>

      <!-- ══ Resolving overlay ══ -->
      @if (game.phase() === 'resolving') {
        <div class="resolving-overlay">
          <div class="resolving-card">
            <div class="spin-ico">⚔️</div>
            <div class="res-title">RESOLVIENDO RONDA {{ game.roundNumber() }}</div>
            <div class="res-sub">Calculando impactos y escudos...</div>
            <div class="res-log">
              @for (e of game.battleLog().slice(0, 10); track $index) {
                <div class="rl-row" [class]="'rl-' + e.type">
                  <span>{{ e.icon }}</span><span>{{ e.message }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ══ Planning content ══ -->
      @if (game.phase() === 'planning') {
        <div class="arena-main">

          <!-- Fighter cards -->
          <div class="fighters-grid" [attr.data-cols]="game.fighters().length">
            @for (f of game.fighters(); track f.factionId; let i = $index) {
              <app-fighter-card [fighter]="f" [fighterIndex]="i" [isPlanning]="i === activeFighterIdx()" />
            }
          </div>

            <!-- ── Plan panel ── -->
            <div class="plan-panel" [style.--pc]="activeFighter().color || '#00f0ff'">
              
              @if (canPlan()) {
                <!-- Fighter tabs (local only) -->
                @if (!game.isMultiplayer()) {
                  <div class="tabs">
                    @for (f of game.fighters(); track f.factionId; let i = $index) {
                      @if (f.alive) {
                        <button class="tab" [class.active]="activeTab() === i" [class.done]="f.planConfirmed"
                          [style.border-color]="f.color" (click)="setTab(i)">
                          <span class="tab-ico" [innerHTML]="f.svgIcon"></span>
                          <span>{{ f.name }}</span>
                          @if (f.planConfirmed) { <span>✅</span> }
                        </button>
                      }
                    }
                  </div>
                }

                <!-- Missile budget -->
                <div class="budget" [class.over]="missilesLeft() < 0">
                  <span class="bud-label">🚀 MISILES DISPONIBLES</span>
                  <span class="bud-val" [class.zero]="missilesLeft() === 0">{{ missilesLeft() }} / 50</span>
                  <div class="bud-bar-track">
                    <div class="bud-bar" [style.width.%]="(missilesLeft() / 50) * 100"></div>
                  </div>
                </div>

                <!-- Attacks -->
                <div class="section">
                  <div class="sec-title">⚔️ ATACAR <span class="sec-hint">(1 misil = 1 daño)</span></div>
                  @for (f of game.fighters(); track f.factionId; let i = $index) {
                    @if (f.alive && i !== activeFighterIdx()) {
                      <div class="atk-row">
                        <div class="atk-target">
                          <span class="atk-dot" [style.background]="f.color"></span>
                          <span class="atk-name">{{ f.name }}</span>
                        </div>
                        <div class="counter">
                          <input type="range" class="atk-slider" 
                            [min]="0" 
                            [max]="missilesLeft() + getAtk(i)" 
                            [value]="getAtk(i)"
                            [disabled]="confirmed()"
                            (input)="onAtkChange(i, $event)">
                          <span class="cnt-val">{{ getAtk(i) }}</span>
                        </div>
                        <span class="atk-dmg">💥 {{ getAtk(i) }} dmg</span>
                      </div>
                    }
                  }
                </div>

                <!-- Shield -->
                <div class="section">
                  <div class="sec-title">🛡️ DEFENDER <span class="sec-hint">(2 misiles = 1 escudo)</span></div>
                  <div class="shield-row">
                    <div class="shield-slider-wrap">
                      <input type="range" class="shield-slider"
                        [min]="0"
                        [max]="missilesLeft() + draftShield()"
                        [step]="2"
                        [value]="draftShield()"
                        [disabled]="confirmed()"
                        (input)="onShieldChange($event)">
                    </div>
                    <div class="shield-info">
                      <span class="cnt-val">{{ draftShield() }} misiles</span>
                      <span class="shield-pts">→ {{ shieldPts() }} puntos de escudo</span>
                    </div>
                  </div>
                </div>

                <!-- Confirm button -->
                @if (!confirmed()) {
                  <button class="confirm-btn" [disabled]="missilesLeft() < 0" (click)="confirmPlan()">
                    🚀 CONFIRMAR PLAN
                  </button>
                } @else {
                  <div class="confirmed-msg">✅ Plan enviado — esperando a los demás...</div>
                }

                <!-- Surrender -->
                <button class="surrender-btn" 
                  [disabled]="!activeFighter().alive || confirmed()" 
                  (click)="surrender()">🏳️ Rendirse</button>

              } @else {
                <!-- Eliminated / Spectator view -->
                <div class="eliminated-panel">
                  <div class="elim-ico">💀</div>
                  <div class="elim-title">ESTÁS FUERA DE COMBATE</div>
                  <div class="elim-txt">
                    @if (activeFighter().surrendered) {
                      Has abandonado el combate. Puedes seguir observando o retirarte.
                    } @else {
                      Tu base ha sido destruida. Observa el final de la batalla.
                    }
                  </div>
                  <button class="abandon-btn" (click)="game.abandonGame()">🚪 ABANDONAR PARTIDA</button>
                </div>
              }

              <!-- Mini log -->
              <div class="mini-log">
                <div class="log-title">📡 LOG</div>
                @for (e of game.battleLog().slice(0, 6); track $index) {
                  <div class="log-row" [class]="'lr-' + e.type">
                    <span class="lr-r">R{{ e.round }}</span>
                    <span>{{ e.icon }}</span>
                    <span class="lr-m">{{ e.message }}</span>
                  </div>
                }
              </div>
            </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      padding: 14px;
      max-width: 1400px;
      margin: 0 auto;
      height: 100vh;
      box-sizing: border-box;
      animation: phase-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    @keyframes phase-in {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .arena-wrap { display: flex; flex-direction: column; gap: 12px; height: 100%; overflow: hidden; }


    /* Top bar */
    .top-bar { display: flex; align-items: center; gap: 14px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 10px 18px; flex-shrink: 0; }
    .round-badge { display: flex; flex-direction: column; align-items: center; min-width: 48px; }
    .rb-label { font-size: 0.52rem; font-weight: 900; letter-spacing: 0.15em; color: rgba(255,255,255,0.35); }
    .rb-num { font-size: 1.4rem; font-weight: 900; color: #fff; line-height: 1; }
    .timer-track { flex: 1; height: 22px; background: rgba(255,255,255,0.06); border-radius: 12px; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
    .timer-fill { height: 100%; background: linear-gradient(90deg, #7c3aed, #00d4ff); border-radius: 12px; transition: width 1s linear; }
    .timer-track.urgent .timer-fill { background: linear-gradient(90deg, #ef4444, #f97316); animation: pulse-bar 0.7s ease-in-out infinite; }
    @keyframes pulse-bar { 0%,100%{opacity:1} 50%{opacity:0.6} }
    .timer-txt { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 900; color: #fff; text-shadow: 0 0 6px #000; }
    .chips-row { display: flex; gap: 6px; flex-wrap: wrap; }
    .chip { display: flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 20px; border: 1.5px solid var(--c, rgba(255,255,255,0.2)); background: rgba(0,0,0,0.3); transition: 0.3s; }
    .chip.confirmed { background: rgba(34,197,94,0.12); border-color: #22c55e; }
    .chip.dead { opacity: 0.25; filter: grayscale(1); }
    .chip-name { font-size: 0.58rem; font-weight: 700; color: rgba(255,255,255,0.7); }
    .chip-ico { font-size: 0.7rem; }

    /* Resolving overlay */
    .resolving-overlay { position: absolute; inset: 0; z-index: 10; background: rgba(0,0,10,0.85); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); border-radius: 16px; }
    .resolving-card { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 40px; max-width: 560px; width: 100%; }
    .spin-ico { font-size: 3rem; animation: spin-ico 1.2s ease-in-out infinite; }
    @keyframes spin-ico { 0%,100%{transform:scale(1) rotate(-10deg)} 50%{transform:scale(1.15) rotate(10deg)} }
    .res-title { font-size: 1.4rem; font-weight: 900; color: #fff; letter-spacing: 0.1em; text-align: center; }
    .res-sub { font-size: 0.75rem; color: rgba(255,255,255,0.45); }
    .res-log { width: 100%; display: flex; flex-direction: column; gap: 4px; max-height: 280px; overflow-y: auto; }
    .rl-row { display: flex; gap: 8px; padding: 6px 10px; background: rgba(255,255,255,0.05); border-radius: 8px; font-size: 0.68rem; color: rgba(255,255,255,0.75); animation: slide-in .3s ease; }
    @keyframes slide-in { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:none} }
    .rl-attack { border-left: 2px solid #ef4444; }
    .rl-shield { border-left: 2px solid #60a5fa; }
    .rl-death  { border-left: 2px solid #6b7280; background: rgba(239,68,68,0.1); }
    .rl-status,.rl-round_start,.rl-resolve { border-left: 2px solid #94a3b8; }

    /* Main area */
    .arena-main { display: grid; grid-template-columns: 1fr 340px; gap: 12px; flex: 1; min-height: 0; position: relative; }
    .fighters-grid { display: grid; gap: 10px; overflow-y: auto; align-content: start; grid-template-columns: repeat(2, 1fr); }
    .fighters-grid[data-cols="3"] { grid-template-columns: repeat(3,1fr); }
    .fighters-grid[data-cols="4"],.fighters-grid[data-cols="5"],.fighters-grid[data-cols="6"],.fighters-grid[data-cols="7"],.fighters-grid[data-cols="8"] { grid-template-columns: repeat(4,1fr); }

    /* Plan panel */
    .plan-panel { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }

    /* Tabs */
    .tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .tab { display: flex; align-items: center; gap: 5px; background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 5px 10px; cursor: pointer; color: rgba(255,255,255,0.55); font-size: 0.65rem; font-weight: 700; transition: 0.2s; }
    .tab:hover { background: rgba(255,255,255,0.09); color: #fff; }
    .tab.active { background: rgba(255,255,255,0.12); color: #fff; box-shadow: 0 0 10px var(--pc); }
    .tab.done { opacity: 0.5; }
    .tab-ico { width: 16px; height: 16px; }
    .tab-ico ::ng-deep svg { width: 100%; height: 100%; }

    /* Budget */
    .budget { display: flex; flex-direction: column; gap: 4px; background: rgba(255,255,255,0.04); border-radius: 10px; padding: 10px 12px; }
    .budget.over { background: rgba(239,68,68,0.1); border: 1px solid #ef4444; }
    .bud-label { font-size: 0.6rem; font-weight: 800; color: rgba(255,255,255,0.4); letter-spacing: 0.1em; }
    .bud-val { font-size: 1.2rem; font-weight: 900; color: #fff; }
    .bud-val.zero { color: rgba(255,255,255,0.3); }
    .bud-bar-track { height: 6px; background: rgba(255,255,255,0.08); border-radius: 4px; overflow: hidden; }
    .bud-bar { height: 100%; background: linear-gradient(90deg, var(--pc), #fff); border-radius: 4px; transition: width 0.3s; }

    /* Sections */
    .section { display: flex; flex-direction: column; gap: 7px; }
    .sec-title { font-size: 0.65rem; font-weight: 900; color: rgba(255,255,255,0.55); letter-spacing: 0.12em; }
    .sec-hint { font-weight: 400; color: rgba(255,255,255,0.3); font-size: 0.58rem; }

    /* Attack rows */
    .atk-row { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.04); border-radius: 8px; padding: 6px 10px; }
    .atk-target { display: flex; align-items: center; gap: 6px; flex: 1; }
    .atk-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .atk-name { font-size: 0.68rem; font-weight: 700; color: rgba(255,255,255,0.8); }
    .atk-dmg { font-size: 0.58rem; color: #ef4444; font-weight: 700; min-width: 48px; text-align: right; }

    /* Counter & Sliders */
    .counter { display: flex; align-items: center; gap: 10px; flex: 1; }
    .cnt-val { font-size: 0.85rem; font-weight: 900; color: #fff; min-width: 28px; text-align: center; }

    .atk-slider, .shield-slider {
      flex: 1;
      -webkit-appearance: none;
      height: 4px;
      background: rgba(255,255,255,0.1);
      border-radius: 2px;
      outline: none;
    }
    .atk-slider::-webkit-slider-thumb, .shield-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px;
      height: 14px;
      background: var(--pc);
      border: 2px solid #fff;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 0 10px var(--pc);
    }
    .shield-slider-wrap { flex: 1; display: flex; align-items: center; }

    /* Shield */
    .shield-row { display: flex; align-items: center; gap: 10px; background: rgba(96,165,250,0.08); border: 1px solid rgba(96,165,250,0.2); border-radius: 8px; padding: 8px 12px; }
    .shield-info { display: flex; flex-direction: column; align-items: center; min-width: 100px; }
    .shield-pts { font-size: 0.6rem; color: #93c5fd; font-weight: 700; }

    /* Confirm */
    .confirm-btn { background: linear-gradient(135deg, var(--pc), rgba(255,255,255,0.2)); border: none; border-radius: 12px; padding: 12px; color: #000; font-weight: 900; font-size: 0.85rem; cursor: pointer; width: 100%; letter-spacing: 0.06em; transition: 0.2s; box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
    .confirm-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
    .confirm-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .confirmed-msg { background: rgba(34,197,94,0.12); border: 1px solid #22c55e; border-radius: 12px; padding: 12px; text-align: center; font-size: 0.75rem; font-weight: 700; color: #22c55e; }
    .surrender-btn { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 10px; padding: 7px; color: #ef4444; font-size: 0.65rem; cursor: pointer; width: 100%; transition: 0.2s; margin-top: 5px; }
    .surrender-btn:hover { background: rgba(239,68,68,0.2); }

    .eliminated-panel { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; text-align: center; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1); }
    .elim-ico { font-size: 2.5rem; filter: drop-shadow(0 0 10px #ef4444); }
    .elim-title { font-size: 1rem; font-weight: 900; color: #ef4444; letter-spacing: 0.1em; }
    .elim-txt { font-size: 0.7rem; color: rgba(255,255,255,0.5); line-height: 1.4; }
    .abandon-btn { background: #fff; color: #000; border: none; border-radius: 8px; padding: 10px 20px; font-weight: 900; font-size: 0.7rem; cursor: pointer; transition: 0.2s; }
    .abandon-btn:hover { background: #ef4444; color: #fff; transform: translateY(-2px); }

    /* Mini log */
    .mini-log { flex: 1; display: flex; flex-direction: column; gap: 3px; min-height: 0; }
    .log-title { font-size: 0.58rem; font-weight: 800; color: rgba(255,255,255,0.25); letter-spacing: 0.1em; margin-bottom: 2px; }
    .log-row { display: flex; gap: 5px; padding: 3px 6px; border-radius: 5px; font-size: 0.55rem; background: rgba(0,0,0,0.2); }
    .lr-attack { border-left: 2px solid #ef4444; }
    .lr-shield { border-left: 2px solid #60a5fa; }
    .lr-death  { border-left: 2px solid #6b7280; }
    .lr-status,.lr-round_start,.rl-resolve { border-left: 2px solid #94a3b8; }
    .lr-r { color: rgba(255,255,255,0.3); font-weight: 700; }
    .lr-m { color: rgba(255,255,255,0.6); }

    @media (max-width: 900px) {
      .arena-main { grid-template-columns: 1fr; }
      .fighters-grid[data-cols] { grid-template-columns: repeat(2,1fr); }
    }
  `]
})
export class BattleArenaComponent {
  game          = inject(GameService);
  socketService = inject(SocketService);

  activeTab   = signal<number>(0);
  draftPlans  = signal<{ [fighterIdx: number]: DraftPlan }>({});

  // ── Derived ──────────────────────────────────────────────────────
  activeFighterIdx = computed(() =>
    this.game.isMultiplayer() ? this.game.myFighterIdx() : this.activeTab()
  );

  activeFighter = computed(() => this.game.fighters()[this.activeFighterIdx()]);

  activeDraft = computed<DraftPlan>(() =>
    this.draftPlans()[this.activeFighterIdx()] ?? { attacks: {}, shieldMissiles: 0 }
  );

  missilesUsed = computed(() => {
    const d = this.activeDraft();
    return Object.values(d.attacks).reduce((s, m) => s + (m as number), 0) + d.shieldMissiles;
  });

  missilesLeft = computed(() => 50 - this.missilesUsed());
  shieldPts    = computed(() => Math.floor(this.activeDraft().shieldMissiles / 2));
  timerPct     = computed(() => (this.game.planningTimeLeft() / 30) * 100);

  confirmed = computed(() => this.game.fighters()[this.activeFighterIdx()]?.planConfirmed ?? false);
  canPlan   = computed(() => this.activeFighter()?.alive && !this.game.winner());

  constructor() {
    // Auto-move to first alive unconfirmed tab when fighters change
    effect(() => {
      const fighters = this.game.fighters();
      const cur = this.activeTab();
      if (!fighters[cur]?.alive || fighters[cur]?.planConfirmed) {
        const next = fighters.findIndex((f, i) => i !== cur && f.alive && !f.planConfirmed);
        if (next >= 0) this.activeTab.set(next);
      }
    });

    // Reset drafts on new round
    effect(() => {
      this.game.roundNumber(); // subscribe
      this.draftPlans.set({});
      const firstAlive = this.game.fighters().findIndex(f => f.alive);
      if (firstAlive >= 0) this.activeTab.set(firstAlive);
    });

    // Multiplayer: receive plan confirmations from server (to show green checks)
    this.socketService.onPlanRecibido().pipe(takeUntilDestroyed()).subscribe(data => {
      this.game.submitPlan(data.actorIdx, data.plan);
    });

    // Multiplayer: receive final resolution from server
    this.socketService.onRondaResuelta().pipe(takeUntilDestroyed()).subscribe(data => {
      console.log('Resolución recibida del servidor:', data);
      this.game.resolveMultiplayerRound(data.planes, data.seed);
    });

    // Multiplayer: receive special actions (like surrender)
    this.socketService.onAccionRecibida().pipe(takeUntilDestroyed()).subscribe(a => {
      if (a.abilityId === 'system_surrender') {
        this.game.applySurrender(a.targetIdx);
      }
    });
  }

  // ── Getters ───────────────────────────────────────────────────────
  getAtk(targetIdx: number): number {
    return (this.activeDraft().attacks[targetIdx] as number) ?? 0;
  }

  draftShield(): number { return this.activeDraft().shieldMissiles; }

  // ── Mutations ─────────────────────────────────────────────────────
  private patchDraft(patch: Partial<DraftPlan>) {
    const fi = this.activeFighterIdx();
    const cur = this.activeDraft();
    this.draftPlans.update(dp => ({ ...dp, [fi]: { ...cur, ...patch } }));
  }

  onAtkChange(targetIdx: number, event: Event) {
    const val = +(event.target as HTMLInputElement).value;
    this.patchDraft({ attacks: { ...this.activeDraft().attacks, [targetIdx]: val } });
  }

  onShieldChange(event: Event) {
    const val = +(event.target as HTMLInputElement).value;
    this.patchDraft({ shieldMissiles: val });
  }

  setTab(i: number) {
    if (!this.game.isMultiplayer()) this.activeTab.set(i);
  }

  // ── Confirm plan ──────────────────────────────────────────────────
  confirmPlan() {
    const fi = this.activeFighterIdx();
    const draft = this.activeDraft();

    const attacks: AttackAssignment[] = Object.entries(draft.attacks)
      .filter(([, m]) => (m as number) > 0)
      .map(([ti, m]) => ({ targetIdx: +ti, missiles: m as number }));

    const totalSpent = attacks.reduce((s, a) => s + a.missiles, 0) + draft.shieldMissiles;

    const plan: PlayerPlan = {
      actorIdx: fi, attacks,
      shieldMissiles: draft.shieldMissiles,
      totalSpent, confirmed: true,
    };

    if (this.game.isMultiplayer()) {
      this.socketService.enviarPlan(fi, plan);
    }
    this.game.submitPlan(fi, plan);
  }

  // ── Surrender ─────────────────────────────────────────────────────
  surrender() {
    const idx = this.activeFighterIdx();
    if (this.game.isMultiplayer()) {
      this.socketService.realizarAccion({ abilityId: 'system_surrender', targetIdx: idx });
    }
    this.game.applySurrender(idx);
  }
}
