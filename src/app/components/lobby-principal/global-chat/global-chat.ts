import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SocketService, MensajeChat } from '../../../services/socket.service';

@Component({
  selector: 'app-global-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h"><h3>CANAL GLOBAL</h3></div>
    <div class="msgs" #m>
      @for (msg of msgs; track $index) {
        <div class="msg"><span class="u">{{ msg.remitente }}:</span><span class="t">{{ msg.contenido }}</span><span class="d">{{ msg.timestamp | date:'HH:mm' }}</span></div>
      }
    </div>
    <div class="input"><input [(ngModel)]="txt" (keydown.enter)="send()" placeholder="Mensaje..."></div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; background: rgba(13,20,28,0.8); border: 1px solid rgba(255,255,255,0.05); height: 100%; }
    .h { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); } h3 { margin: 0; font-size: 14px; color: #00f0ff; letter-spacing: 1px; }
    .msgs { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
    .msg { font-size: 12px; display: flex; gap: 6px; align-items: baseline; }
    .u { color: #00f0ff; font-weight: 700; } .t { color: #fff; flex: 1; } .d { font-size: 9px; color: rgba(255,255,255,0.2); }
    .input { padding: 10px; border-top: 1px solid rgba(255,255,255,0.05); }
    input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 8px; color: #fff; width: 100%; box-sizing: border-box; }
  `]
})
export class GlobalChatComponent implements OnInit {
  ss = inject(SocketService);
  msgs: MensajeChat[] = [];
  txt = '';
  constructor() {
    this.ss.onMensajeGlobal().pipe(takeUntilDestroyed()).subscribe(m => {
      this.msgs.push(m);
      setTimeout(() => { const e = document.querySelector('.msgs'); if(e) e.scrollTop = e.scrollHeight; }, 50);
    });
  }
  ngOnInit() {}
  send() { if (!this.txt.trim()) return; this.ss.enviarMensajeGlobal(this.txt.trim()); this.txt = ''; }
}
