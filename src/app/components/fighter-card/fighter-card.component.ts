import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Fighter } from '../../models/game.models';

@Component({
  selector: 'app-fighter-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fighter-card"
      [class.active]="isActive()"
      [class.dead]="!fighter().alive"
      [class.targetable]="isTargetable()"
      [style.--f-color]="fighter().color"
      [style.--f-from]="fighter().gradientFrom"
      [style.--f-to]="fighter().gradientTo"
      (click)="onTargetClick()"
    >
      <div class="glow-ring"></div>
      <div class="turn-badge" [class.show]="isActive() && userTurn()">TU TURNO</div>

      <!-- Debug info -->
      <div style="position: absolute; bottom: 2px; right: 5px; font-size: 8px; color: rgba(255,255,255,0.2);">
        idx: {{ fighterIndex() }} | T: {{ isTargetable() }}
      </div>

      <!-- Icon -->
      <div class="fighter-icon" [innerHTML]="fighter().svgIcon"></div>

      <!-- Name -->
      <h3 class="fighter-name">{{ fighter().name }}</h3>

      <!-- HP Bar -->
      <div class="bar-wrap">
        <div class="bar-label">
          <span>❤️ Vida (HP)</span>
          <span>{{ fighter().hp }} / {{ fighter().maxHp }}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill hp-bar" [style.width.%]="hpPct" [class.critical]="hpPct < 25"></div>
          @if (fighter().shieldHp > 0) {
            <div class="shield-bar" [style.width.%]="shieldPct" [title]="'Escudo: ' + fighter().shieldHp + ' HP'"></div>
          }
        </div>
      </div>

      <!-- Missile Bar -->
      <div class="bar-wrap">
        <div class="bar-label">
          <span>🚀 Misiles</span>
          <span>{{ fighter().missiles }} / {{ fighter().maxMissiles }}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill missile-bar" [style.width.%]="missilePct" [class.low]="missilePct < 20"></div>
        </div>
      </div>

      <!-- Stats row -->
      <div class="stats-row">
        <span title="Armadura (reducción de daño)">🛡️ {{ fighter().armor }}</span>
        @if (fighter().shieldHp > 0) {
          <span class="shield-tag" title="Escudo activo">🔰 {{ fighter().shieldHp }}</span>
        }
        <span class="passive-badge" [title]="fighter().passive.name + ': ' + fighter().passive.description">
          {{ fighter().passive.icon }} Pasiva
        </span>
      </div>

      <!-- Status effects -->
      @if (fighter().statusEffects.length > 0) {
        <div class="status-row">
          @for (e of fighter().statusEffects; track e.name) {
            <span class="status-chip" [title]="e.name + ' – ' + e.turnsLeft + ' turns'">
              {{ e.icon }} {{ e.turnsLeft }}
            </span>
          }
        </div>
      }

      @if (!fighter().alive) {
        <div class="dead-overlay">💥 DESTRUIDO</div>
      }
    </div>
  `,
  styles: [`
    .fighter-card {
      position: relative; border-radius: 16px; overflow: hidden;
      border: 2px solid rgba(255,255,255,0.08);
      background: linear-gradient(155deg, var(--f-from), var(--f-to));
      padding: 14px; display: flex; flex-direction: column; gap: 8px;
      transition: all 0.3s ease; cursor: default;
    }
    .fighter-card.active {
      border-color: var(--f-color);
      box-shadow: 0 0 0 2px var(--f-color), 0 0 28px var(--f-color);
      animation: pulse-glow 2s ease-in-out infinite;
    }
    @keyframes pulse-glow {
      0%,100% { box-shadow: 0 0 0 2px var(--f-color), 0 0 20px var(--f-color); }
      50%      { box-shadow: 0 0 0 3px var(--f-color), 0 0 40px var(--f-color); }
    }
    .fighter-card.targetable { cursor: crosshair; border-color: rgba(255,80,80,0.5); }
    .fighter-card.targetable:hover {
      border-color: #ff4444;
      box-shadow: 0 0 0 2px #ff4444, 0 0 22px rgba(255,68,68,0.5);
      transform: scale(1.03);
    }
    .fighter-card.dead { opacity: 0.3; filter: grayscale(90%); pointer-events: none; }

    .glow-ring {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 0%, var(--f-color) 0%, transparent 65%);
      opacity: 0.1; pointer-events: none;
    }
    .turn-badge {
      position: absolute; top: 8px; right: 8px;
      background: var(--f-color); color: #000;
      font-size: 0.52rem; font-weight: 900; letter-spacing: 0.12em;
      border-radius: 20px; padding: 2px 8px;
      opacity: 0; transition: opacity 0.3s;
    }
    .turn-badge.show { opacity: 1; animation: badge-pop 1.2s ease-in-out infinite; }
    @keyframes badge-pop { 0%,100% { transform:scale(1); } 50% { transform:scale(1.1); } }

    .fighter-icon { width: 68px; height: 68px; margin: 0 auto; filter: drop-shadow(0 0 8px var(--f-color)); }
    .fighter-icon ::ng-deep svg { width: 100%; height: 100%; }
    .fighter-name { font-size: 0.82rem; font-weight: 800; text-align: center; color: var(--f-color); margin: 0; letter-spacing: 0.04em; }

    /* Bars */
    .bar-wrap { display: flex; flex-direction: column; gap: 2px; }
    .bar-label { display: flex; justify-content: space-between; font-size: 0.6rem; color: rgba(255,255,255,0.55); }
    .bar-track { height: 8px; background: rgba(0,0,0,0.45); border-radius: 4px; overflow: hidden; position: relative; }
    .bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    .hp-bar { background: linear-gradient(90deg, #22c55e, #4ade80); }
    .hp-bar.critical { background: linear-gradient(90deg, #ef4444, #f97316); animation: crit 0.7s ease-in-out infinite; }
    @keyframes crit { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
    .missile-bar { background: linear-gradient(90deg, #f97316, #fbbf24); }
    .missile-bar.low { background: linear-gradient(90deg, #dc2626, #ef4444); }
    .shield-bar {
      position: absolute; top: 0; height: 100%; border-radius: 4px;
      background: rgba(147,197,253,0.55); max-width: 100%;
    }

    .stats-row {
      display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
      font-size: 0.68rem; font-weight: 700; color: rgba(255,255,255,0.8);
    }
    .shield-tag { color: #93c5fd; }
    .passive-badge {
      background: rgba(255,255,255,0.08); border-radius: 4px; padding: 1px 6px;
      font-size: 0.55rem; color: rgba(255,255,255,0.6); cursor: help;
      display: flex; align-items: center; gap: 3px;
    }
    .status-row { display: flex; flex-wrap: wrap; gap: 4px; }
    .status-chip {
      font-size: 0.58rem; background: rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.15); border-radius: 10px;
      padding: 2px 6px; cursor: help;
    }
    .dead-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,0.75);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.95rem; font-weight: 900; color: #ef4444; letter-spacing: 0.1em;
    }
  `]
})
export class FighterCardComponent {
  fighter = input.required<Fighter>();
  fighterIndex = input<number>(0);
  isActive = input(false);
  userTurn = input(true);
  isTargetable = input(false);
  targetSelected = output<void>();

  get hpPct()      { return Math.max(0, (this.fighter().hp      / this.fighter().maxHp)      * 100); }
  get missilePct() { return Math.max(0, (this.fighter().missiles / this.fighter().maxMissiles) * 100); }
  get shieldPct()  { return Math.min(100, (this.fighter().shieldHp / this.fighter().maxHp)   * 100); }

  onTargetClick() { if (this.isTargetable()) this.targetSelected.emit(); }
}
