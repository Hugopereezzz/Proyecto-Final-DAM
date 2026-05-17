// src/app/components/lobby-principal/global-ranking/global-ranking.ts
// Este archivo representa la tabla de clasificacion (ranking) global.
// Se encarga de pedir la lista de los mejores jugadores al servidor cada pocos segundos.
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
  // Servicio de autenticación inyectado para obtener la clasificación de usuarios
  auth = inject(AuthService);
  // Lista de usuarios ordenados por victorias (ranking) que se muestra en la vista
  ranking: Usuario[] = [];
  // Controla el estado de carga visual en la pantalla
  cargando = true;
  // Almacena un mensaje de error si ocurre un fallo al obtener el ranking desde la API
  error: string | null = null;

  constructor() {
    // Establece un temporizador periódico que recarga el ranking automáticamente cada 5 segundos
    interval(5000).pipe(takeUntilDestroyed()).subscribe(() => this.load());
  }

  // Carga inicial del ranking al iniciar el componente
  ngOnInit() { this.load(); }

  // Consume el endpoint del backend para obtener el ranking y maneja la respuesta o el error
  load() {
    this.auth.obtenerRanking().subscribe({
      next: (d) => { this.ranking = d; this.cargando = false; },
      error: () => { this.error = 'Error cargando ranking'; this.cargando = false; }
    });
  }
}
