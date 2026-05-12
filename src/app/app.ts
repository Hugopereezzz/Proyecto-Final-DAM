import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from './services/game.service';
import { SocketService } from './services/socket.service';
import { LoginComponent } from './components/login/login';
import { LobbyPrincipalComponent } from './components/lobby-principal/lobby-principal';
import { BattleArenaComponent } from './components/battle-arena/battle-arena.component';
import { GameOverComponent } from './components/game-over/game-over.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LoginComponent, LobbyPrincipalComponent, BattleArenaComponent, GameOverComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  game   = inject(GameService);
  socket = inject(SocketService);
}
