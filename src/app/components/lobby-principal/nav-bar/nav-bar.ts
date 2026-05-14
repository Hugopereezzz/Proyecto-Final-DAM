// src/app/components/lobby-principal/nav-bar/nav-bar.ts
import { Component, inject } from '@angular/core';
import { UpperCasePipe, CommonModule } from '@angular/common';
import { GameService } from '../../../services/game.service';
import { AuthService } from '../../../services/auth.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [UpperCasePipe, CommonModule],
  templateUrl: './nav-bar.html',
  styleUrls: ['./nav-bar.css']
})
export class NavBarComponent {
  readonly game = inject(GameService);
  private readonly auth = inject(AuthService);

  showStats = signal<boolean>(false);
  userStats = signal<any>(null);
  loading = signal<boolean>(false);

  toggleStats() {
    console.log('toggleStats called. Current state:', this.showStats());
    if (!this.showStats()) {
      this.showStats.set(true);
      const username = this.game.loggedInUser();
      console.log('Fetching stats for user:', username);
      if (username) {
        this.loading.set(true);
        this.auth.obtenerEstadisticas(username).subscribe({
          next: (stats) => {
            console.log('Stats received:', stats);
            this.userStats.set(stats);
            this.loading.set(false);
          },
          error: (err) => {
            console.error('Error fetching stats:', err);
            this.loading.set(false);
          }
        });
      }
    } else {
      this.showStats.set(false);
    }
  }
}
