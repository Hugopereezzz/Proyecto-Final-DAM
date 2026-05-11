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
  imports: [CommonModule, NavBarComponent, GlobalRankingComponent, GlobalChatComponent, LobbyCreationComponent, AvailableLobbiesComponent, SalaJuegoComponent],
  template: `
    <div class="lobby-grid" *ngIf="v === 'lobby'">
      <app-nav-bar class="nav" [username]="username()"></app-nav-bar>
      <app-global-ranking class="ranking cyber-panel"></app-global-ranking>
      <app-lobby-creation class="actions cyber-panel" (salaUnida)="onJoin($event)"></app-lobby-creation>
      <app-available-lobbies class="lobbies cyber-panel" (salaUnida)="onJoin($event)"></app-available-lobbies>
      <app-global-chat class="chat cyber-panel"></app-global-chat>
    </div>
    <app-sala-juego *ngIf="v === 'sala' && s" [cs]="c" [si]="s" [mn]="username()" (salidaSala)="onLeave()"></app-sala-juego>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100vh; background: var(--bg-dark); padding: 10px; box-sizing: border-box; }
    .lobby-grid { display: grid; width: 100%; height: 100%; gap: 15px; grid-template: "nav nav nav" 60px "rank act chat" auto "rank lob chat" 1fr / 250px 1fr 300px; }
    .nav { grid-area: nav; } .ranking { grid-area: rank; } .actions { grid-area: act; } .lobbies { grid-area: lob; } .chat { grid-area: chat; }
    @media (max-width: 1024px) { .lobby-grid { grid-template: "nav nav" 60px "rank act" auto "rank lob" 1fr "chat chat" 300px / 200px 1fr; } }
    @media (max-width: 768px) { :host { height: auto; overflow: auto; } .lobby-grid { display: flex; flex-direction: column; } .nav { min-height: 60px; } .ranking,.actions,.lobbies,.chat { min-height: 300px; } }
  `]
})
export class LobbyPrincipalComponent implements OnInit {
  private ss = inject(SocketService);
  username = input<string>('Usuario');
  v: 'lobby' | 'sala' = 'lobby';
  c = ''; s: Sala | null = null;
  ngOnInit() { this.ss.conectar(this.username()); }
  onJoin(d: { codigo: string; sala: Sala }) { this.c = d.codigo; this.s = d.sala; this.v = 'sala'; }
  onLeave() { this.c = ''; this.s = null; this.v = 'lobby'; this.ss.pedirSalas(); }
}
