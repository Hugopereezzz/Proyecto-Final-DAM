import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FactionTemplate } from '../../models/game.models';

@Component({
  selector: 'app-faction-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="f-card" [class.sel]="selected" [class.dis]="disabled && !selected"
      (click)="onSelect()"
      [style.--fc]="faction.color"
      [style.--ff]="faction.gradientFrom"
      [style.--ft]="faction.gradientTo">

      <div class="glow"></div>
      <div class="badge" [class.vis]="selected">✓ SELECCIONADA</div>

      <div class="body">
        <div class="icon" [innerHTML]="faction.svgIcon"></div>
        <div class="info">
          <h3 class="name">{{ faction.name }}</h3>
          <p class="lore">{{ faction.lore }}</p>

          <!-- Stats (uniform for all factions) -->
          <div class="stats">
            <div class="s-item"><span>❤️</span><span class="v">500</span><span class="l">Vida</span></div>
            <div class="s-item"><span>🚀</span><span class="v">50</span><span class="l">Misiles</span></div>
            <div class="s-item"><span>⏱️</span><span class="v">30s</span><span class="l">Por ronda</span></div>
          </div>

          <!-- Rules pills -->
          <div class="pills">
            <span class="pill">⚔️ 1 misil = 1 daño</span>
            <span class="pill">🛡️ 2 misiles = 1 escudo</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .f-card { position: relative; border-radius: 16px; overflow: hidden; border: 2px solid rgba(255,255,255,0.07); background: linear-gradient(140deg, var(--ff), var(--ft)); cursor: pointer; transition: .3s; }
    .f-card:hover:not(.dis) { transform: translateY(-6px); border-color: var(--fc); box-shadow: 0 14px 40px #000, 0 0 22px var(--fc); }
    .f-card.sel { border-color: var(--fc); box-shadow: 0 0 0 2px var(--fc), 0 12px 40px #000, 0 0 30px var(--fc); transform: translateY(-4px); }
    .f-card.dis { opacity: 0.38; cursor: not-allowed; }
    .glow { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 0%, var(--fc) 0%, transparent 65%); opacity: 0; transition: .3s; pointer-events: none; }
    .f-card.sel .glow, .f-card:hover:not(.dis) .glow { opacity: 0.12; }
    .badge { position: absolute; top: 10px; right: 10px; background: var(--fc); color: #000; font-size: 0.6rem; font-weight: 900; border-radius: 20px; padding: 2px 9px; opacity: 0; transition: .2s; }
    .badge.vis { opacity: 1; }
    .body { display: flex; flex-direction: column; align-items: center; padding: 18px 14px; gap: 12px; }
    .icon { width: 80px; height: 80px; filter: drop-shadow(0 0 12px var(--fc)); }
    .icon ::ng-deep svg { width: 100%; height: 100%; }
    .info { width: 100%; display: flex; flex-direction: column; gap: 8px; text-align: center; }
    .name { font-size: 1rem; font-weight: 900; color: var(--fc); margin: 0; }
    .lore { font-size: 0.65rem; color: rgba(255,255,255,0.5); margin: 0; line-height: 1.5; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .s-item { display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.2); border-radius: 8px; padding: 5px; }
    .s-item .v { font-size: 0.75rem; font-weight: 900; color: #fff; }
    .s-item .l { font-size: 0.5rem; color: rgba(255,255,255,0.4); text-transform: uppercase; }
    .pills { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
    .pill { font-size: 0.58rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 2px 7px; color: rgba(255,255,255,0.7); }
  `]
})
export class FactionCardComponent {
  @Input() faction!: FactionTemplate;
  @Input() selected  = false;
  @Input() disabled  = false;
  @Output() selectedChange = new EventEmitter<string>();

  onSelect() {
    if (!this.disabled || this.selected) this.selectedChange.emit(this.faction.id);
  }
}
