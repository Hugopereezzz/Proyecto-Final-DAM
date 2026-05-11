import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from './services/game.service';
import { SocketService } from './services/socket.service';
import { LoginComponent } from './components/login/login';
import { LobbyPrincipalComponent } from './components/lobby-principal/lobby-principal';
import { FactionSelectComponent } from './components/faction-select/faction-select.component';
import { BattleArenaComponent } from './components/battle-arena/battle-arena.component';
import { GameOverComponent } from './components/game-over/game-over.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LoginComponent, LobbyPrincipalComponent, FactionSelectComponent, BattleArenaComponent, GameOverComponent],
  template: `
    <div class="app-root">
      <div class="bg-grid"></div><div class="bg-orb o1"></div><div class="bg-orb o2"></div><div class="bg-orb o3"></div>
      <main class="m">
        @switch (game.phase()) {
          @case ('login') { <div class="l-w ent"><app-login (loginSuccess)="game.onLoginSuccess($event.username)" /></div> }
          @case ('lobby') { <app-lobby-principal [username]="game.loggedInUser()||'Jugador'" /> }
          @case ('selection') { <app-faction-select class="ent" /> }
          @case ('battle') { <div class="b-v ent"><app-battle-arena /></div> }
          @case ('gameover') { <app-game-over class="ent" /> }
        }
      </main>
    </div>
  `,
  styles: [`
    .app-root { min-height: 100vh; display: flex; flex-direction: column; position: relative; overflow-x: hidden; background: #05050a; color: #fff; }
    .bg-grid { position: fixed; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px); background-size: 50px 50px; pointer-events: none; }
    .bg-orb { position: fixed; border-radius: 50%; filter: blur(100px); opacity: 0.1; animation: d 20s infinite; }
    .o1 { width: 500px; height: 500px; top: -100px; left: -100px; background: #7c3aed; }
    .o2 { width: 400px; height: 400px; bottom: -100px; right: -100px; background: #0ea5e9; animation-delay: -5s; }
    .o3 { width: 300px; height: 300px; top: 50%; left: 50%; background: #ef4444; animation-delay: -10s; }
    @keyframes d { 0%,100% { transform: translate(0,0); } 50% { transform: translate(20px,20px); } }
    .m { flex: 1; } .l-w { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .b-v { padding: 20px; max-width: 1200px; margin: 0 auto; height: 100vh; box-sizing: border-box; }
    .ent { animation: i 0.4s ease-out; } @keyframes i { from { opacity: 0; transform: translateY(10px); } }
  `]
})
export class App {
  game = inject(GameService);
  socket = inject(SocketService);

  surrender() {
    if (!this.game.isMyTurn()) return;
    const idx = this.game.currentFighterIndex();
    if (this.game.isMultiplayer()) {
      this.socket.realizarAccion({ abilityId: 'system_surrender', targetIdx: idx });
    } else {
      this.game.applySurrender(idx);
    }
  }
}
