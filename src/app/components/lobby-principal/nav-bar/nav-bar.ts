import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="nav-wrap">
      <div class="logo"><span class="i">🚀</span><div><span class="t1">PULSO</span><span class="t2">GLOBAL</span></div></div>
      <div class="links"><div class="sys">SYSTEM NAV</div><div class="ls"><span class="active">INICIO</span> | <span>PERFIL</span> | <span>LOGS</span></div></div>
      <div class="user">
        <div class="profile"><span class="ui">👤</span><div><span class="un">{{ username() | uppercase }}</span><span class="st"><span class="dot"></span> ON</span></div></div>
        <button class="btn" (click)="auth.logout()">🚪 <span>SALIR</span></button>
      </div>
    </div>
  `,
  styles: [`
    .nav-wrap { display: flex; align-items: center; justify-content: space-between; height: 60px; padding: 0 10px; background: rgba(0,0,0,0.4); border-bottom: 1px solid rgba(255,255,255,0.05); }
    .logo { display: flex; align-items: center; gap: 8px; } .logo .i { font-size: 1.5rem; } .logo .t1 { font-weight: 900; color: #fff; } .logo .t2 { font-weight: 300; color: #00d4ff; }
    .links { display: flex; flex-direction: column; align-items: center; } .sys { font-size: 0.6rem; color: #00d4ff; font-weight: 900; } .ls { font-size: 0.7rem; color: rgba(255,255,255,0.4); } .ls .active { color: #fff; }
    .user { display: flex; align-items: center; gap: 10px; }
    .profile { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 5px 12px; border-radius: 20px; }
    .un { font-size: 0.75rem; font-weight: 900; color: #fff; } .st { font-size: 0.55rem; color: #2ecc71; display: flex; align-items: center; gap: 4px; } .dot { width: 5px; height: 5px; background: #2ecc71; border-radius: 50%; box-shadow: 0 0 5px #2ecc71; }
    .btn { background: rgba(255,0,0,0.1); border: 1px solid #f44; color: #f44; border-radius: 8px; padding: 6px 12px; cursor: pointer; font-size: 0.7rem; font-weight: 900; }
  `]
})
export class NavBarComponent {
  auth = inject(AuthService);
  username = input<string>('Operador');
}
