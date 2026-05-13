import { Component, inject, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SocketService, Sala, Jugador, MensajeChat } from '../../services/socket.service';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-sala-juego',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wrap">
      <div class="info cyber-panel">
        <div class="head">
          <div class="title"><h2>{{ s?.nombre || 'Conectando...' }}</h2><span class="type" *ngIf="s">{{ s?.tipo }}</span></div>
          <div class="code"><span>🔑 {{ id() }}</span><button (click)='copy()'>{{ cp?'OK':'📋' }}</button></div>
        </div>
        <div class="section"><h3>👥 OPERATIVOS</h3>
          <div class="list">
            @for (j of s?.jugadores; track j.socketId) {
              <div class="p-card" [class.me]="j.socketId===ss.getMiSocketId()">
                <div class="p-info"><span>{{ j.nombre }}</span><span class="p-st" [class.r]="j.listo">{{ j.listo?'READY':'WAIT' }}</span></div>
                <div class="p-f" [style.border-color]="f(j.faccionId!)?.color">{{ f(j.faccionId!)?.name || '...' }}</div>
                @if (j.socketId===s?.host) { <span class="crown">👑</span> }
              </div>
            }
          </div>
        </div>
        <div class="section"><h3>🚀 ELIGE FACCIÓN</h3>
          <div class="f-grid">
            @for (f of gs.factions; track f.id) {
              <div class="f-item" [class.sel]="mj?.faccionId===f.id" [class.tk]="isTk(f.id)" (click)="selF(f.id)" [style.border-color]="f.color">
                <div class="f-i" [innerHTML]="f.svgIcon"></div><div class="f-n">{{ f.name }}</div>
              </div>
            }
          </div>
        </div>
        <div class="ctrls">
          <button class="btn ok" (click)="ss.cambiarListo()" [class.r]="mj?.listo">{{ mj?.listo?'✅ LISTO':'LISTO' }}</button>
          @if (soyH) { <button class="btn go" [disabled]="!allR || !allF || (s?.jugadores?.length||0)<2" (click)="ss.iniciarJuego()">🚀 INICIAR</button> }
          <button class="btn out" (click)="out()">SALIR</button>
        </div>
      </div>
      <div class="chat cyber-panel">
        <div class="c-h"><h3>CHAT SALA</h3></div>
        <div class="c-m">
          @for (m of msgs; track $index) {
            <div class="m" [class.sys]="m.tipo==='sistema'" [class.yo]="m.remitente===mn">
              <span class="mt">{{ m.timestamp }}</span><span class="mu">{{ m.remitente }}:</span><span class="mc">{{ m.contenido }}</span>
            </div>
          }
        </div>
        <div class="c-i"><input [(ngModel)]="txt" (keydown.enter)="send()" placeholder="Chat..."><button (click)="send()">🚀</button></div>
      </div>
    </div>
  `,
  styles: [`
    .wrap { display: flex; gap: 20px; height: 100vh; padding: 20px; box-sizing: border-box; background: var(--bg-dark); }
    .info { flex: 1; display: flex; flex-direction: column; gap: 20px; padding: 20px; }
    .head { display: flex; justify-content: space-between; align-items: center; } h2 { margin: 0; color: #00f0ff; }
    .type { font-size: 10px; padding: 2px 8px; background: rgba(255,255,255,0.1); border-radius: 10px; }
    .code { display: flex; gap: 10px; align-items: center; } .code button { background: none; border: 1px solid #00f0ff; color: #00f0ff; cursor: pointer; }
    .section h3 { font-size: 12px; color: rgba(255,255,255,0.4); margin-bottom: 10px; }
    .list { display: flex; flex-direction: column; gap: 8px; }
    .p-card { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.05); padding: 8px 15px; border-radius: 8px; }
    .p-card.me { border-left: 3px solid #00f0ff; }
    .p-info { display: flex; flex-direction: column; flex: 1; } .p-st { font-size: 9px; color: #666; } .p-st.r { color: #00ff00; }
    .p-f { font-size: 10px; border: 1px solid #444; padding: 2px 8px; border-radius: 10px; }
    .f-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; }
    .f-item { padding: 10px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; text-align: center; cursor: pointer; transition: .2s; }
    .f-item.sel { background: rgba(255,255,255,0.1); } .f-item.tk { opacity: 0.3; cursor: not-allowed; }
    .f-i { width: 30px; height: 30px; margin: 0 auto; } .f-i ::ng-deep svg { width: 100%; height: 100%; } .f-n { font-size: 9px; margin-top: 5px; }
    .ctrls { display: flex; gap: 10px; margin-top: auto; }
    .btn { flex: 1; padding: 12px; border: none; border-radius: 8px; color: #fff; font-weight: 900; cursor: pointer; transition: .2s; }
    .ok { background: #333; } .ok.r { background: #2ecc71; }
    .go { background: linear-gradient(135deg, #00d4ff, #0082ff); } .go:disabled { opacity: 0.3; }
    .out { background: #ff4757; max-width: 100px; }
    .chat { width: 300px; display: flex; flex-direction: column; padding: 15px; }
    .c-m { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; }
    .m { font-size: 11px; display: flex; gap: 5px; } .mu { font-weight: 900; color: #00f0ff; } .mt { font-size: 9px; color: #555; }
    .m.sys { color: #fbbf24; } .m.yo .mu { color: #fff; }
    .c-i { display: flex; gap: 5px; margin-top: 10px; }
    input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid #333; color: #fff; padding: 8px; border-radius: 4px; }
    .c-i button { background: #00f0ff; border: none; border-radius: 4px; cursor: pointer; }
    @media (max-width: 800px) { .wrap { flex-direction: column; height: auto; } .chat { width: 100%; height: 400px; } }
  `]
})
export class SalaJuegoComponent implements OnInit {
  ss = inject(SocketService); gs = inject(GameService); router = inject(Router);
  id = input.required<string>();
  mn = this.gs.loggedInUser() ?? 'Jugador';
  
  s: Sala | null = null; msgs: MensajeChat[] = []; txt = ''; cp = false;

  constructor() {
    this.ss.onSalaActualizada().pipe(takeUntilDestroyed()).subscribe(s => {
      if (!this.s && s) {
        this.msgs.push({ 
          remitente: 'SISTEMA', 
          contenido: 'SALA: ' + s.nombre, 
          tipo: 'sistema', 
          timestamp: new Date().toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) 
        });
      }
      this.s = s;
    });
    this.ss.onMensajeSala().pipe(takeUntilDestroyed()).subscribe(m => { this.msgs.push(m); this.scroll(); });
    this.ss.onBatallaComenzada().pipe(takeUntilDestroyed()).subscribe(d => { this.gs.isMultiplayer.set(true); this.gs.startBattle(d.ids, d.order, d.nombres); });
  }

  ngOnInit() {
    if (!this.ss.estaConectado()) {
      this.ss.conectar(this.mn);
    }
    this.ss.unirseSala(this.id());
  }

  get soyH() { return this.s?.host === this.ss.getMiSocketId(); }
  get allR() { return this.s?.jugadores.every(j => j.listo) || false; }
  get allF() { return this.s?.jugadores.every(j => !!j.faccionId) || false; }
  get mj() { return this.s?.jugadores.find(j => j.socketId === this.ss.getMiSocketId()); }
  f(id: string) { return this.gs.factions.find(f => f.id === id); }
  isTk(id: string) { return this.s?.jugadores.some(j => j.faccionId === id && j.socketId !== this.ss.getMiSocketId()) || false; }
  selF(id: string) { if (!this.isTk(id)) this.ss.seleccionarFaccion(id); }
  send() { if (this.txt.trim()) { this.ss.enviarMensajeSala(this.txt.trim()); this.txt = ''; } }
  out() { this.ss.salirSala(); this.router.navigate(['/lobby']); }
  copy() { navigator.clipboard.writeText(this.id()).then(() => { this.cp = true; setTimeout(()=>this.cp=false,2000); }); }
  scroll() { setTimeout(() => { const e = document.querySelector('.c-m'); if(e) e.scrollTop = e.scrollHeight; }, 50); }
}
