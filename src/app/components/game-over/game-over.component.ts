import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-game-over',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="go-wrap">
      <div class="particles">@for (p of particles; track $index) { <div class="p" [style]="p"></div> }</div>
      <div class="go-card" [class.defeat]="!isWinner()">
        <div class="trophy">{{ isWinner() ? '🏆' : '💀' }}</div>
        <div class="v-pre">{{ isWinner() ? 'VICTORIA TÁCTICA' : 'MISIÓN FALLIDA' }}</div>
        <h1 class="w-name" [style.color]="wf()?.color">
          {{ isWinner() ? '¡HAS GANADO!' : game.winner() + ' Vence' }}
        </h1>
        <div class="w-icon" [innerHTML]="wf()?.svgIcon"></div>
        <p class="w-lore">{{ isWinner() ? 'Has demostrado ser el estratega definitivo.' : wf()?.lore }}</p>

        <div class="stats">
          <div class="s-row"><span>⏱️ Duración</span><span class="v">{{ game.roundNumber() - 1 }} rondas</span></div>
          <div class="s-row"><span>🚀 Ataques</span><span class="v">{{ attackCount() }}</span></div>
          <div class="s-row"><span>🛡️ Escudos</span><span class="v">{{ shieldCount() }}</span></div>
          <div class="s-row"><span>📋 Eventos</span><span class="v">{{ game.battleLog().length }}</span></div>
        </div>

        <div class="replay">
          <div class="log-list">
            @for (e of game.battleLog().slice().reverse(); track $index) {
              <div class="l-row" [class]="'log-' + e.type">
                <span class="t">R{{ e.round }}</span>
                <span>{{ e.icon }}</span>
                <span>{{ e.message }}</span>
              </div>
            }
          </div>
        </div>

        <button class="btn" (click)="game.resetGame()">🚀 Nueva Misión</button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      animation: phase-in 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    @keyframes phase-in {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .go-wrap { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; overflow: hidden; }

    .particles { position: fixed; inset: 0; pointer-events: none; }
    .p { position: absolute; width: 6px; height: 6px; border-radius: 50%; animation: f linear infinite; opacity: 0.6; }
    @keyframes f { 0%{transform:translateY(100vh) rotate(0deg);opacity:0} 10%,90%{opacity:0.6} 100%{transform:translateY(-20vh) rotate(720deg);opacity:0} }
    .go-card { background: rgba(10,10,20,0.95); border: 1px solid rgba(255,255,255,0.1); border-radius: 28px; padding: 30px; max-width: 550px; width: 100%; display: flex; flex-direction: column; align-items: center; gap: 14px; box-shadow: 0 40px 100px #000; backdrop-filter: blur(20px); }
    .go-card.defeat { border-color: rgba(239,68,68,0.2); }
    .go-card.defeat .v-pre { color: #ef4444; text-shadow: 0 0 20px rgba(239,68,68,0.5); }
    .trophy { font-size: 4rem; animation: b 1s ease-in-out infinite; }
    @keyframes b { 0%,100%{transform:scale(1) rotate(-5deg)} 50%{transform:scale(1.1) rotate(5deg)} }
    .v-pre { font-size: 0.7rem; font-weight: 900; letter-spacing: 0.4em; color: #ffd700; text-shadow: 0 0 20px rgba(255,215,0,0.5); }
    .w-name { font-size: 2.4rem; font-weight: 900; margin: 0; text-shadow: 0 0 30px currentColor; }
    .w-icon { width: 100px; height: 100px; filter: drop-shadow(0 0 20px rgba(255,255,255,0.3)); animation: fl 4s ease-in-out infinite; }
    .w-icon ::ng-deep svg { width: 100%; height: 100%; }
    @keyframes fl { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    .w-lore { text-align: center; color: rgba(255,255,255,0.6); font-size: 0.8rem; line-height: 1.5; }
    .stats { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 15px 20px; width: 100%; }
    .s-row { display: flex; justify-content: space-between; font-size: 0.75rem; color: rgba(255,255,255,0.6); padding: 5px 0; }
    .s-row + .s-row { border-top: 1px solid rgba(255,255,255,0.05); }
    .s-row .v { font-weight: 900; color: #fff; }
    .replay { width: 100%; }
    .log-list { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 5px; }
    .l-row { display: flex; gap: 8px; padding: 6px 10px; border-radius: 8px; font-size: 0.65rem; background: rgba(255,255,255,0.04); border-left: 3px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.7); }
    .log-attack  { border-left-color: #ef4444; }
    .log-shield  { border-left-color: #60a5fa; }
    .log-death   { border-left-color: #6b7280; background: rgba(239,68,68,0.1); }
    .log-status, .log-round_start, .log-resolve { border-left-color: #94a3b8; }
    .l-row .t { color: rgba(255,255,255,0.3); font-weight: 800; min-width: 28px; }
    .btn { background: linear-gradient(135deg,#7c3aed,#4f46e5); border: none; border-radius: 14px; padding: 14px 40px; cursor: pointer; font-size: 1rem; font-weight: 900; color: #fff; box-shadow: 0 10px 30px rgba(124,58,237,0.4); transition: 0.3s; }
    .btn:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(124,58,237,0.6); }
  `]
})
export class GameOverComponent {
  game = inject(GameService);

  wf           = computed(() => this.game.factions.find(f => f.name === this.game.winner()));
  isWinner     = computed(() => {
    const winnerName = this.game.winner();
    const myFighter  = this.game.fighters()[this.game.myFighterIdx()];
    if (!myFighter) return true; // Default to win display in single player if winner name is present
    return myFighter.name === winnerName;
  });
  attackCount  = computed(() => this.game.battleLog().filter(e => e.type === 'attack').length);
  shieldCount  = computed(() => this.game.battleLog().filter(e => e.type === 'shield').length);

  particles = Array.from({ length: 20 }, (_, i) => {
    const c = ['#ffd700','#7c3aed','#ef4444','#22c55e','#60a5fa','#f97316','#00d4ff'][i % 7];
    return `left:${Math.random()*100}%;width:${3+Math.random()*8}px;height:${3+Math.random()*8}px;background:${c};animation-duration:${5+Math.random()*7}s;animation-delay:${Math.random()*5}s;`;
  });
}
