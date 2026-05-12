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
      [class.planning]="isPlanning()"
      [class.dead]="!fighter().alive"
      [class.confirmed]="fighter().planConfirmed && fighter().alive"
      [style.--f-color]="fighter().color"
      [style.--f-from]="fighter().gradientFrom"
      [style.--f-to]="fighter().gradientTo"
    >
      <div class="glow-ring"></div>

      <!-- Plan status badge -->
      @if (fighter().alive) {
        <div class="plan-badge" [class.ok]="fighter().planConfirmed">
          {{ fighter().planConfirmed ? '✅ LISTO' : '⏳ PENSANDO' }}
        </div>
      }

      <!-- Icon -->
      <div class="fighter-icon" [innerHTML]="fighter().svgIcon"></div>

      <!-- Name -->
      <h3 class="fighter-name">{{ fighter().name }}</h3>
      <div class="player-name">{{ fighter().playerName }}</div>

      <!-- HP Bar -->
      <div class="bar-wrap">
        <div class="bar-label">
          <span>❤️ HP</span>
          <span>{{ fighter().hp }} / {{ fighter().maxHp }}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill hp-bar" [style.width.%]="hpPct" [class.critical]="hpPct < 25"></div>
          @if (fighter().shieldHp > 0) {
            <div class="shield-bar" [style.width.%]="shieldPct" [title]="'Escudo: ' + fighter().shieldHp"></div>
          }
        </div>
      </div>

      <!-- Shield indicator -->
      @if (fighter().shieldHp > 0) {
        <div class="shield-tag">🛡️ {{ fighter().shieldHp }} escudo</div>
      }

      <!-- Dead overlay -->
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
    .fighter-card.planning {
      border-color: var(--f-color);
      box-shadow: 0 0 0 2px var(--f-color), 0 0 28px var(--f-color);
      animation: pulse-glow 2s ease-in-out infinite;
    }
    @keyframes pulse-glow {
      0%,100% { box-shadow: 0 0 0 2px var(--f-color), 0 0 20px var(--f-color); }
      50%      { box-shadow: 0 0 0 3px var(--f-color), 0 0 40px var(--f-color); }
    }
    .fighter-card.confirmed { border-color: #22c55e; box-shadow: 0 0 16px rgba(34,197,94,0.3); }
    .fighter-card.dead { opacity: 0.28; filter: grayscale(90%); pointer-events: none; }

    .glow-ring {
      position: absolute; inset: 0;
      background: radial-gradient(ellipse at 50% 0%, var(--f-color) 0%, transparent 65%);
      opacity: 0.1; pointer-events: none;
    }

    .plan-badge {
      position: absolute; top: 8px; right: 8px;
      background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15);
      font-size: 0.48rem; font-weight: 900; letter-spacing: 0.08em;
      border-radius: 20px; padding: 2px 7px; color: rgba(255,255,255,0.5);
    }
    .plan-badge.ok { background: rgba(34,197,94,0.2); border-color: #22c55e; color: #22c55e; }

    .fighter-icon { width: 60px; height: 60px; margin: 0 auto; filter: drop-shadow(0 0 8px var(--f-color)); }
    .fighter-icon ::ng-deep svg { width: 100%; height: 100%; }
    .fighter-name { font-size: 0.8rem; font-weight: 800; text-align: center; color: var(--f-color); margin: 0; }
    .player-name  { font-size: 0.58rem; text-align: center; color: rgba(255,255,255,0.4); margin-top: -4px; }

    .bar-wrap { display: flex; flex-direction: column; gap: 2px; }
    .bar-label { display: flex; justify-content: space-between; font-size: 0.58rem; color: rgba(255,255,255,0.5); }
    .bar-track { height: 8px; background: rgba(0,0,0,0.45); border-radius: 4px; overflow: hidden; position: relative; }
    .bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    .hp-bar { background: linear-gradient(90deg, #22c55e, #4ade80); }
    .hp-bar.critical { background: linear-gradient(90deg, #ef4444, #f97316); animation: crit 0.7s ease-in-out infinite; }
    @keyframes crit { 0%,100%{opacity:1} 50%{opacity:0.6} }
    .shield-bar {
      position: absolute; top: 0; height: 100%; border-radius: 4px;
      background: rgba(147,197,253,0.6); max-width: 100%;
    }

    .shield-tag { font-size: 0.62rem; font-weight: 700; color: #93c5fd; text-align: center; }

    .dead-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,0.75);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem; font-weight: 900; color: #ef4444; letter-spacing: 0.1em;
    }
  `]
})
export class FighterCardComponent {
  fighter      = input.required<Fighter>();
  fighterIndex = input<number>(0);
  isPlanning   = input(false);

  get hpPct()     { return Math.max(0, (this.fighter().hp / this.fighter().maxHp) * 100); }
  get shieldPct() { return Math.min(100, (this.fighter().shieldHp / this.fighter().maxHp) * 100); }
}
