// src/app/components/lobby-principal/lobby-principal.ts
// Este archivo representa el Menu Principal del juego (Lobby General).
// Es la pantalla central donde el usuario puede ver su perfil, el chat global,
// el ranking y crear o unirse a salas multijugador.
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
  // Servicio de Sockets inyectado para la gestión de comunicación en tiempo real
  private readonly ss = inject(SocketService);
  // Servicio de Juego global inyectado para obtener los datos de la sesión actual
  readonly gs         = inject(GameService);
  // Enrutador de Angular para poder redirigir al usuario entre páginas
  private readonly router = inject(Router);

  constructor() {}

  // Al iniciar el componente, conecta el WebSocket utilizando el nombre del usuario
  // logueado y pide la lista de salas públicas que estén disponibles para jugar
  ngOnInit(): void { 
    this.ss.conectar(this.gs.loggedInUser() ?? 'Jugador'); 
    this.ss.pedirSalas();
  }

  // Se ejecuta al unirse con éxito a una sala (desde la lista de disponibles o creando una).
  // Redirige la pantalla del usuario a la vista de la sala utilizando su código único.
  onSalaUnida(d: { codigo: string; sala: Sala }) {
    this.router.navigate(['/sala', d.codigo]);
  }
}
