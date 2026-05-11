import { Component, input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavBarComponent } from './nav-bar/nav-bar';
import { GlobalRankingComponent } from './global-ranking/global-ranking';
import { GlobalChatComponent } from './global-chat/global-chat';
import { LobbyCreationComponent } from './lobby-creation/lobby-creation';
import { AvailableLobbiesComponent } from './available-lobbies/available-lobbies';
import { SalaJuegoComponent } from '../sala-juego/sala-juego';
import { SocketService, Sala } from '../../services/socket.service';

@Component({
  selector: 'app-lobby-principal',
  standalone: true,
  imports: [
    CommonModule,
    NavBarComponent,
    GlobalRankingComponent,
    GlobalChatComponent,
    LobbyCreationComponent,
    AvailableLobbiesComponent,
    SalaJuegoComponent
  ],
  templateUrl: './lobby-principal.html',
  styleUrls: ['./lobby-principal.css']
})
export class LobbyPrincipalComponent implements OnInit {
  private ss = inject(SocketService);
  username = input<string>('Usuario');
  vistaActual: 'lobby' | 'sala' = 'lobby';
  codigoSalaActual = '';
  salaActual: Sala | null = null;

  ngOnInit() { this.ss.conectar(this.username()); }

  onSalaUnida(d: { codigo: string; sala: Sala }) {
    this.codigoSalaActual = d.codigo;
    this.salaActual = d.sala;
    this.vistaActual = 'sala';
  }

  onSalidaSala() {
    this.codigoSalaActual = '';
    this.salaActual = null;
    this.vistaActual = 'lobby';
    this.ss.pedirSalas();
  }
}
