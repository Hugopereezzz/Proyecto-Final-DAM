// src/app/components/lobby-principal/available-lobbies/available-lobbies.ts
// Este archivo muestra una lista de las salas multijugador publicas disponibles.
// Se actualiza en tiempo real permitiendo a los jugadores unirse haciendo clic en una sala.
import { Component, inject, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SocketService, SalaPublica, Sala } from '../../../services/socket.service';

@Component({
  selector: 'app-available-lobbies',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './available-lobbies.html',
  styleUrls: ['./available-lobbies.css']
})
export class AvailableLobbiesComponent implements OnInit {
  // Servicio de Sockets inyectado para recibir actualizaciones de salas y emitir peticiones de unión
  ss = inject(SocketService);
  // Emisor de eventos (Output de Angular) para notificar al componente padre cuando nos unimos a una sala
  salaUnida = output<{ codigo: string; sala: Sala }>();
  // Listado de salas públicas disponibles que se renderizará en el HTML
  salasPublicas: SalaPublica[] = [];

  constructor() {
    // Escucha las actualizaciones en tiempo real de las salas públicas que envía el servidor
    this.ss.onSalasActualizadas().pipe(takeUntilDestroyed()).subscribe(s => this.salasPublicas = s);
    // Escucha la confirmación del servidor de que nos hemos unido correctamente a una sala
    this.ss.onSalaUnido().pipe(takeUntilDestroyed()).subscribe(r => {
      if (r.ok) this.salaUnida.emit({ codigo: r.codigo, sala: r.sala });
    });
  }

  // Al inicializar, solicita al servidor el listado actual de salas públicas activas
  ngOnInit() { this.ss.pedirSalas(); }

  // Envía una petición al servidor para unirse a una sala específica por su código
  unirseASala(codigo: string) { this.ss.unirseSala(codigo); }

  // Permite refrescar manualmente la lista de salas disponibles desde la interfaz de usuario
  refrescar() { this.ss.pedirSalas(); }
}
