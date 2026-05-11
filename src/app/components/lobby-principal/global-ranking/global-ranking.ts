import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { AuthService, Usuario } from '../../../services/auth.service';

@Component({
  selector: 'app-global-ranking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h"><h2>🚀 TOP JUGADORES</h2></div>
    <div class="table">
      @if (loading) { <div class="m">Cargando...</div> }
      @for (u of rank; track u.id; let i = $index) {
        <div class="row">
          <span class="r">#{{ i + 1 }}</span>
          <span class="n">{{ u.nombreUsuario }}</span>
          <span class="v">🏆 {{ u.victorias }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; background: rgba(13,20,28,0.8); border: 1px solid rgba(255,255,255,0.05); height: 100%; }
    .h { padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; } h2 { margin: 0; font-size: 14px; color: #fbbf24; }
    .table { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 5px; }
    .row { display: flex; align-items: center; gap: 10px; padding: 8px; background: rgba(255,255,255,0.03); border-radius: 4px; font-size: 12px; }
    .r { color: #fbbf24; font-weight: 900; width: 30px; } .n { flex: 1; color: #fff; } .v { font-weight: 700; color: #00d4ff; }
    .m { text-align: center; color: rgba(255,255,255,0.3); padding: 20px; font-size: 11px; }
  `]
})
export class GlobalRankingComponent implements OnInit {
  auth = inject(AuthService);
  rank: Usuario[] = []; loading = true;
  constructor() {
    interval(5000).pipe(takeUntilDestroyed()).subscribe(() => this.load());
  }
  ngOnInit() { this.load(); }
  load() { this.auth.obtenerRanking().subscribe(d => { this.rank = d; this.loading = false; }); }
}
