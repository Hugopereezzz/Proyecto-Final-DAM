// src/app/components/lobby-principal/nav-bar/nav-bar.ts
// Este archivo representa la barra de navegacion superior en el lobby.
// Se encarga de mostrar el nombre del jugador y un boton para ver sus estadisticas.
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
  // Servicio de Juego inyectado para obtener datos rápidos del usuario (como el nombre del logueado)
  readonly game = inject(GameService);
  // Servicio de Autenticación inyectado para consumir la API de estadísticas del jugador
  private readonly auth = inject(AuthService);

  // Señal reactiva (Signal) de Angular para controlar la visibilidad del modal de estadísticas
  showStats = signal<boolean>(false);
  // Señal que almacena el objeto de estadísticas detalladas recibido del servidor
  userStats = signal<any>(null);
  // Señal que gestiona el estado de carga mientras se solicita la información a la API
  loading = signal<boolean>(false);

  // Muestra u oculta el modal de estadísticas. Si se va a abrir, realiza una petición HTTP al backend
  // para traer los datos estadísticos más recientes del usuario logueado en ese momento.
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
