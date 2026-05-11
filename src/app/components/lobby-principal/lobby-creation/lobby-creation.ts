import { Component, inject, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SocketService, Sala } from '../../../services/socket.service';

@Component({
  selector: 'app-lobby-creation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (v === 'd') {
      <div class="h"><span>COMANDO DE SALA</span></div>
      <div class="acts">
        <button class="b c" (click)="v='c'"><div><span class="t">CREAR SALA</span><span class="s">PÚBLICO/PRIVADA</span></div><span>🔑</span></button>
        <button class="b j" (click)="v='u'"><div><span class="t">UNIRSE</span><span class="s">POR CÓDIGO</span></div><span>🔍</span></button>
      </div>
    } @else {
      <div class="card">
        <div class="m-h"><h3>{{ v==='c'?'CREAR SALA':'UNIRSE' }}</h3><button (click)="v='d'">✕</button></div>
        @if (v === 'c') {
          <div class="g"><label>NOMBRE</label><input [(ngModel)]="n" placeholder="Nombre sala"></div>
          <div class="g"><label>TIPO</label>
            <div class="sel"><button [class.a]="t==='publica'" (click)="t='publica'">🌐 PÚB</button><button [class.a]="t==='privada'" (click)="t='privada'">🔒 PRIV</button></div>
          </div>
          <button class="b c" (click)="crear()" [disabled]="loading">{{ loading?'...':'CREAR' }}</button>
        } @else {
          <div class="g"><label>CÓDIGO</label><input [(ngModel)]="ci" placeholder="CÓDIGO" style="text-transform:uppercase;text-align:center"></div>
          <button class="b j" (click)="unirse()" [disabled]="loading">{{ loading?'...':'UNIRSE' }}</button>
        }
        @if (err) { <p class="err">{{ err }}</p> }
      </div>
    }
  `,
  styles: [`
    :host { padding: 15px; display: flex; flex-direction: column; gap: 15px; }
    .h { font-size: 10px; color: rgba(255,255,255,0.4); text-align: center; }
    .acts { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .b { display: flex; align-items: center; justify-content: space-between; padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; background: rgba(255,255,255,0.05); color: #fff; transition: .2s; }
    .b div { display: flex; flex-direction: column; align-items: flex-start; }
    .b .t { font-weight: 900; font-size: 14px; } .b .s { font-size: 9px; color: rgba(255,255,255,0.4); }
    .b.c:hover { border-color: #00f0ff; box-shadow: 0 0 10px rgba(0,240,255,0.2); }
    .b.j:hover { border-color: #7c3aed; box-shadow: 0 0 10px rgba(124,58,237,0.2); }
    .card { background: rgba(13,20,28,0.9); padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 15px; }
    .m-h { display: flex; justify-content: space-between; align-items: center; } h3 { margin: 0; font-size: 16px; color: #00f0ff; }
    .g { display: flex; flex-direction: column; gap: 5px; } label { font-size: 10px; color: #00f0ff; font-weight: 700; }
    input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 10px; color: #fff; width: 100%; box-sizing: border-box; }
    .sel { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .sel button { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 8px; border-radius: 4px; cursor: pointer; font-size: 11px; }
    .sel button.a { background: rgba(0,240,255,0.2); border-color: #00f0ff; }
    .err { color: #ff4757; font-size: 11px; margin: 0; text-align: center; }
    @media (max-width: 600px) { .acts { grid-template-columns: 1fr; } }
  `]
})
export class LobbyCreationComponent implements OnInit {
  ss = inject(SocketService);
  salaUnida = output<{ codigo: string; sala: Sala }>();
  v: 'd' | 'c' | 'u' = 'd';
  n = ''; t: 'publica' | 'privada' = 'publica';
  ci = ''; err = ''; loading = false;

  constructor() {
    this.ss.onSalaCreada().pipe(takeUntilDestroyed()).subscribe(r => r.ok && this.salaUnida.emit({ codigo: r.codigo, sala: r.sala }));
    this.ss.onSalaUnido().pipe(takeUntilDestroyed()).subscribe(r => r.ok && this.salaUnida.emit({ codigo: r.codigo, sala: r.sala }));
    this.ss.onErrorSala().pipe(takeUntilDestroyed()).subscribe(r => { this.err = r.mensaje; this.loading = false; });
  }
  ngOnInit() {}
  crear() { if (!this.n.trim()) { this.err = 'Nombre requerido'; return; } this.loading = true; this.ss.crearSala(this.n.trim(), this.t); }
  unirse() { if (!this.ci.trim()) { this.err = 'Código requerido'; return; } this.loading = true; this.ss.unirseSala(this.ci.trim()); }
}
