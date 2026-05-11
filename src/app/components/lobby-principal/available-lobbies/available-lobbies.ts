import { Component, inject, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SocketService, SalaPublica, Sala } from '../../../services/socket.service';

@Component({
  selector: 'app-available-lobbies',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h"><h2>SALAS DISPONIBLES</h2><p>ZONAS DE COMBATE PÚBLICAS</p></div>
    <div class="grid">
      @if (salas.length === 0) { <div class="empty"><p>No hay salas disponibles.</p><span>¡Crea una!</span></div> }
      @for (s of salas; track s.codigo) {
        <div class="card">
          <div class="dot"></div>
          <div class="info"><span class="n">{{ s.nombre }}</span><span class="c">🔑 {{ s.codigo }}</span></div>
          <div class="p">{{ s.jugadoresActuales }}/{{ s.maxJugadores }}</div>
          <button (click)="ss.unirseSala(s.codigo)">UNIRSE</button>
        </div>
      }
    </div>
    <div class="foot">* SALAS PRIVADAS REQUIEREN CÓDIGO *</div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; padding: 15px; height: 100%; box-sizing: border-box; }
    .h { text-align: center; margin-bottom: 20px; }
    h2 { color: #00f0ff; font-size: 1.2rem; margin: 0; }
    p { font-size: 10px; color: rgba(255,255,255,0.4); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; overflow-y: auto; flex: 1; padding-right: 5px; }
    .empty { grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.3); padding: 30px; }
    .card { display: flex; align-items: center; background: rgba(17,29,36,0.9); border: 1px solid rgba(0,240,255,0.3); border-radius: 4px; padding: 10px; gap: 10px; transition: .2s; }
    .card:hover { border-color: #00f0ff; box-shadow: 0 0 10px rgba(0,240,255,0.2); }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #00ff00; box-shadow: 0 0 5px #00ff00; }
    .info { flex: 1; display: flex; flex-direction: column; }
    .n { font-size: 14px; font-weight: 700; color: #fff; } .c { font-size: 11px; color: rgba(255,255,255,0.4); }
    .p { font-size: 13px; color: #fff; margin: 0 5px; }
    button { background: transparent; border: 1px solid #00f0ff; color: #00f0ff; padding: 4px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; transition: .2s; }
    button:hover { background: rgba(0,240,255,0.2); box-shadow: 0 0 10px rgba(0,240,255,0.5); }
    .foot { text-align: center; font-size: 10px; color: rgba(255,255,255,0.3); padding-top: 10px; }
    @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class AvailableLobbiesComponent implements OnInit {
  ss = inject(SocketService);
  salaUnida = output<{ codigo: string; sala: Sala }>();
  salas: SalaPublica[] = [];
  constructor() {
    this.ss.onSalasActualizadas().pipe(takeUntilDestroyed()).subscribe(s => this.salas = s);
    this.ss.onSalaUnido().pipe(takeUntilDestroyed()).subscribe(r => r.ok && this.salaUnida.emit({ codigo: r.codigo, sala: r.sala }));
  }
  ngOnInit() { this.ss.pedirSalas(); }
}
