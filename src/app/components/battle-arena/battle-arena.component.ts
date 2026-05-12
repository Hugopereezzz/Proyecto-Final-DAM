import { Component, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { SocketService } from '../../services/socket.service';
import { FighterCardComponent } from '../fighter-card/fighter-card.component';
import { Ability } from '../../models/game.models';

@Component({
  selector: 'app-battle-arena',
  standalone: true,
  imports: [CommonModule, FighterCardComponent],
  template: `
    <div class="arena-wrap">
      <div class="turn-banner">
        <div class="turn-meta">
          <span class="turn-num">T{{ game.turnNumber() }}</span>
          <span class="acting-name" [style.color]="game.currentFighter().color">{{ game.currentFighter().name }}</span>
        </div>
        @if (!socketService.estaConectado()) {
          <div class="connection-warning">⚠️ <button (click)="socketService.conectar(game.loggedInUser() || 'Player')">Reconectar</button></div>
        }
        <div class="order-strip">
          @for (idx of game.turnOrder(); track idx) {
            <div class="order-chip" [class.active]="idx === game.currentFighterIndex()" [class.dead]="!game.fighters()[idx].alive" [style.border-color]="game.fighters()[idx].color">
              <span class="o-icon" [innerHTML]="game.fighters()[idx].svgIcon"></span>
              <span class="o-name">{{ game.fighters()[idx].name }}</span>
            </div>
          }
        </div>
      </div>

      <div class="arena-main">
        <div class="fighters-grid" [attr.data-cols]="game.fighters().length">
          @for (f of game.fighters(); track f.factionId; let i = $index) {
            <app-fighter-card [fighter]="f" [fighterIndex]="i" [isActive]="i === game.currentFighterIndex()" [userTurn]="game.isMyTurn()" [isTargetable]="isTargetable(i)" (targetSelected)="performAction(i)" />
          }
        </div>

        <div class="action-panel" [style.--actor-color]="game.currentFighter().color">
          <div class="actor-header">
            <div class="actor-icon" [innerHTML]="game.currentFighter().svgIcon"></div>
            <div class="actor-info">
              <div class="actor-name" [style.color]="game.currentFighter().color">{{ game.currentFighter().name }}</div>
              <div class="actor-missiles">🚀 {{ game.currentFighter().missiles }}/{{ game.currentFighter().maxMissiles }}</div>
              <div class="actor-instruction">{{ instruction() }}</div>
            </div>
            @if (selectedAbility()) { <button class="cancel-btn" (click)="selectedAbility.set(null)">✕</button> }
          </div>

          <div class="abilities-list" [class.turn-lock]="!game.isMyTurn()">
            @for (ab of game.currentFighter().abilities; track ab.id) {
              <button class="ability-btn" [class.selected]="selectedAbility()?.id === ab.id" [disabled]="!game.isMyTurn() || ab.currentCooldown > 0 || game.currentFighter().missiles < ab.missileCost" (click)="selectAbility(ab)" [title]="ab.description">
                <span class="ab-icon">{{ ab.icon }}</span>
                <div class="ab-body">
                  <div class="ab-top">
                    <span class="ab-name">{{ ab.name }}</span>
                    <span class="ab-cost">🚀{{ ab.missileCost }}</span>
                    @if (ab.currentCooldown > 0) { <span class="ab-cd">⏳{{ ab.currentCooldown }}</span> }
                  </div>
                  <div class="ab-desc">{{ ab.description }}</div>
                </div>
              </button>
            }
          </div>

          @if (selectedAbility() && game.isSelfAbility(selectedAbility()!) && game.isMyTurn()) {
            <button class="fire-self-btn" (click)="performAction(game.currentFighterIndex())">✨ Usar {{ selectedAbility()!.name }}</button>
          }

          <div class="log-section">
            <div class="log-title">📡 LOG</div>
            <div class="log-list">
              @for (entry of game.battleLog().slice(0, 5); track $index) {
                <div class="log-row" [class]="'log-' + entry.type">
                  <span class="log-turn">T{{ entry.turn }}</span>
                  <span class="log-icon">{{ entry.abilityIcon }}</span>
                  <span class="log-msg">{{ entry.message }}</span>
                </div>
              }
            </div>
          </div>

          @if (myFighterIndex !== -1) {
            <button class="surrender-btn" (click)="surrender()">🏳️ Rendirse / Abandonar</button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .arena-wrap { display: flex; flex-direction: column; gap: 12px; height: 100%; overflow: hidden; }
    .turn-banner { background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 10px 18px; display: flex; align-items: center; gap: 18px; flex-shrink: 0; }
    .turn-meta { display: flex; align-items: baseline; gap: 8px; }
    .turn-num { font-size: 0.7rem; font-weight: 800; color: rgba(255,255,255,0.4); }
    .acting-name { font-size: 1rem; font-weight: 900; }
    .connection-warning { background: rgba(255,0,0,0.2); border: 1px solid #f44; color: #f44; padding: 5px 12px; border-radius: 20px; font-size: 0.7rem; margin-left: auto; display: flex; gap: 8px; animation: blink 1s infinite alternate; }
    @keyframes blink { from { opacity: 0.6; } to { opacity: 1; } }
    .connection-warning button { background: #f44; border: none; color: #fff; border-radius: 4px; padding: 2px 6px; cursor: pointer; }
    .order-strip { display: flex; gap: 6px; flex: 1; }
    .order-chip { display: flex; align-items: center; gap: 4px; border: 1.5px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 3px 8px; background: rgba(0,0,0,0.3); transition: 0.3s; }
    .order-chip.active { background: rgba(255,255,255,0.1); box-shadow: 0 0 10px currentColor; }
    .order-chip.dead { opacity: 0.2; filter: grayscale(1); }
    .o-icon { width: 18px; height: 18px; }
    .o-icon ::ng-deep svg { width: 100%; height: 100%; }
    .o-name { font-size: 0.55rem; font-weight: 700; color: rgba(255,255,255,0.7); }
    .arena-main { display: grid; grid-template-columns: 1fr 320px; gap: 12px; flex: 1; min-height: 0; }
    .fighters-grid { display: grid; gap: 10px; overflow-y: auto; align-content: start; grid-template-columns: repeat(2, 1fr); }
    .fighters-grid[data-cols="3"] { grid-template-columns: repeat(3, 1fr); }
    .fighters-grid[data-cols="4"],.fighters-grid[data-cols="5"],.fighters-grid[data-cols="6"],.fighters-grid[data-cols="7"],.fighters-grid[data-cols="8"] { grid-template-columns: repeat(4, 1fr); }
    .action-panel { background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
    .actor-header { display: flex; align-items: center; gap: 10px; }
    .actor-icon { width: 44px; height: 44px; filter: drop-shadow(0 0 8px var(--actor-color)); }
    .actor-icon ::ng-deep svg { width: 100%; height: 100%; }
    .actor-info { flex: 1; min-width: 0; }
    .actor-name { font-size: 0.9rem; font-weight: 900; }
    .actor-missiles { font-size: 0.65rem; color: #fbbf24; font-weight: 700; }
    .actor-instruction { font-size: 0.6rem; color: rgba(255,255,255,0.4); }
    .cancel-btn { background: rgba(239,68,68,0.2); border: 1px solid #ef4444; color: #ef4444; border-radius: 8px; padding: 4px 8px; cursor: pointer; }
    .abilities-list { display: flex; flex-direction: column; gap: 6px; }
    .abilities-list.turn-lock { pointer-events: none; opacity: 0.7; }
    .ability-btn { display: flex; gap: 10px; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.09); border-radius: 10px; padding: 10px; cursor: pointer; color: #fff; transition: 0.2s; width: 100%; text-align: left; }
    .ability-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); border-color: var(--actor-color); }
    .ability-btn.selected { background: rgba(255,255,255,0.14); border-color: var(--actor-color); box-shadow: 0 0 10px var(--actor-color); }
    .ability-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .ab-icon { font-size: 1.2rem; }
    .ab-body { flex: 1; }
    .ab-top { display: flex; align-items: center; gap: 6px; }
    .ab-name { font-size: 0.75rem; font-weight: 800; }
    .ab-cost,.ab-cd { font-size: 0.6rem; font-weight: 700; color: #fbbf24; }
    .ab-cd { color: #f97316; }
    .ab-desc { font-size: 0.58rem; color: rgba(255,255,255,0.4); margin-top: 2px; }
    .fire-self-btn { background: var(--actor-color); border: none; border-radius: 10px; padding: 10px; color: #000; font-weight: 900; cursor: pointer; width: 100%; }
    .log-section { flex: 1; display: flex; flex-direction: column; gap: 4px; min-height: 0; }
    .log-title { font-size: 0.6rem; font-weight: 800; color: rgba(255,255,255,0.3); }
    .log-list { display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
    .log-row { display: flex; gap: 6px; padding: 4px 8px; border-radius: 6px; font-size: 0.58rem; background: rgba(0,0,0,0.2); border-left: 2px solid rgba(255,255,255,0.1); animation: log-in .3s ease; }
    @keyframes log-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
    .log-missile,.log-snipe { border-left-color: #ef4444; }
    .log-burst { border-left-color: #f97316; }
    .log-aoe { border-left-color: #a855f7; }
    .log-drain { border-left-color: #ec4899; }
    .log-shield { border-left-color: #60a5fa; }
    .log-reload { border-left-color: #22c55e; }
    .log-death { border-left-color: #6b7280; background: rgba(239,68,68,0.1); }
    .log-status { border-left-color: #94a3b8; }
    .log-turn { color: rgba(255,255,255,0.3); font-weight: 700; }
    .log-msg { color: rgba(255,255,255,0.6); }
    .surrender-btn { background: rgba(239,68,68,0.15); border: 1px solid #ef4444; border-radius: 10px; padding: 8px; color: #ef4444; font-weight: 800; cursor: pointer; width: 100%; transition: 0.2s; margin-top: 5px; }
    .surrender-btn:hover { background: rgba(239,68,68,0.4); color: white; }
    @media (max-width: 900px) { .arena-main { grid-template-columns: 1fr; } .fighters-grid[data-cols] { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class BattleArenaComponent {
  game = inject(GameService);
  socketService = inject(SocketService);
  selectedAbility = signal<Ability | null>(null);

  instruction = computed(() => {
    const ab = this.selectedAbility();
    if (!this.game.isMyTurn()) return `Esperando a ${this.game.currentFighter().playerName}...`;
    if (!ab) return 'Selecciona habilidad';
    return this.game.isSelfAbility(ab) ? 'Usa en ti mismo' : 'Elige objetivo';
  });

  get myFighterIndex(): number {
    if (!this.game.isMultiplayer()) return this.game.currentFighterIndex();
    return this.game.fighters().findIndex(f => f.playerName === this.game.loggedInUser() && f.alive);
  }

  constructor() {
    this.socketService.onAccionRecibida().pipe(takeUntilDestroyed()).subscribe(a => {
      if (a.abilityId === 'system_surrender') {
        this.game.applySurrender(a.targetIdx);
      } else {
        this.game.useAbility(a.abilityId, a.targetIdx, a.extra);
      }
    });
  }

  isTargetable(idx: number) {
    const ab = this.selectedAbility();
    return this.game.isMyTurn() && !!ab && !this.game.isSelfAbility(ab) && this.game.getValidTargets(ab).includes(idx);
  }

  selectAbility(ab: Ability) { this.selectedAbility.set(this.selectedAbility()?.id === ab.id ? null : ab); }

  performAction(targetIdx: number) {
    const ab = this.selectedAbility();
    if (!ab) return;

    const extra: any = {};
    if (this.game.currentFighter().factionId === 'storm_legion') {
      extra.costFree = Math.random() < 0.15;
    }

    if (this.game.isMultiplayer()) {
      this.socketService.realizarAccion({ abilityId: ab.id, targetIdx, extra });
    } else {
      this.game.useAbility(ab.id, targetIdx, extra);
    }
    this.selectedAbility.set(null);
  }

  surrender() {
    const idx = this.myFighterIndex;
    if (idx === -1) return;
    this.game.isMultiplayer() ? this.socketService.realizarAccion({ abilityId: 'system_surrender', targetIdx: idx }) : this.game.applySurrender(idx);
  }
}
