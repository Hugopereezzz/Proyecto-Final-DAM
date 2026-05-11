import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { AuthService, Usuario } from '../../../services/auth.service';

@Component({
  selector: 'app-global-ranking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './global-ranking.html',
  styleUrls: ['./global-ranking.css']
})
export class GlobalRankingComponent implements OnInit {
  auth = inject(AuthService);
  ranking: Usuario[] = [];
  cargando = true;
  error: string | null = null;

  constructor() {
    interval(5000).pipe(takeUntilDestroyed()).subscribe(() => this.load());
  }

  ngOnInit() { this.load(); }

  load() {
    this.auth.obtenerRanking().subscribe({
      next: (d) => { this.ranking = d; this.cargando = false; },
      error: () => { this.error = 'Error cargando ranking'; this.cargando = false; }
    });
  }
}
