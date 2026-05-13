// src/app/components/lobby-principal/lobby-principal.ts
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavBarComponent } from './nav-bar/nav-bar';
import { GlobalRankingComponent } from './global-ranking/global-ranking';
import { GlobalChatComponent } from './global-chat/global-chat';
import { LobbyCreationComponent } from './lobby-creation/lobby-creation';
import { AvailableLobbiesComponent } from './available-lobbies/available-lobbies';
import { SocketService, Sala } from '../../services/socket.service';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-lobby-principal',
  standalone: true,
  imports: [
    NavBarComponent,
    GlobalRankingComponent,
    GlobalChatComponent,
    LobbyCreationComponent,
    AvailableLobbiesComponent
  ],
  templateUrl: './lobby-principal.html',
  styleUrls: ['./lobby-principal.css']
})
export class LobbyPrincipalComponent implements OnInit {
  private readonly ss = inject(SocketService);
  readonly gs         = inject(GameService);
  private readonly router = inject(Router);

  constructor() {}

  ngOnInit(): void { 
    this.ss.conectar(this.gs.loggedInUser() ?? 'Jugador'); 
    this.ss.pedirSalas();
  }

  onSalaUnida(d: { codigo: string; sala: Sala }) {
    this.router.navigate(['/sala', d.codigo]);
  }
}
