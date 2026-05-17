// src/app/components/lobby-principal/lobby-creation/lobby-creation.ts
// Este archivo es el componente que permite crear o unirse a salas.
// Aqui el jugador puede escribir el nombre para crear una sala nueva o meter el codigo de una existente.
import { Component, inject, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SocketService, Sala } from '../../../services/socket.service';

@Component({
  selector: 'app-lobby-creation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lobby-creation.html',
  styleUrls: ['./lobby-creation.css']
})
export class LobbyCreationComponent implements OnInit {
  // Servicio de Sockets inyectado para la gestión de salas (crear, unirse y escuchar respuestas)
  ss = inject(SocketService);
  // Emisor de eventos de Angular para notificar al componente padre que se ha entrado a una sala
  salaUnida = output<{ codigo: string; sala: Sala }>();

  // Controla qué sub-vista mostrar en el HTML (botones por defecto, formulario de creación o de unión)
  vistaActual: 'default' | 'crear' | 'unirse' = 'default';
  // Enlaza el nombre de la sala que se va a crear (Model-binding)
  nombreSala = '';
  // Enlaza la visibilidad de la sala a crear (Pública o Privada)
  tipoSala: 'publica' | 'privada' = 'publica';
  // Enlaza el código introducido por el usuario para buscar una sala existente
  codigoInput = '';
  // Mensaje de error para mostrar en la interfaz si algo falla
  errorSala = '';
  // Estado que previene envíos múltiples y muestra indicadores de carga
  cargando = false;

  constructor() {
    // Escucha la confirmación del servidor de que la sala se ha creado con éxito y nos redirige a ella
    this.ss.onSalaCreada().pipe(takeUntilDestroyed()).subscribe(r => {
      if (r.ok) this.salaUnida.emit({ codigo: r.codigo, sala: r.sala });
    });
    // Escucha la confirmación de que nos hemos unido correctamente a una sala existente
    this.ss.onSalaUnido().pipe(takeUntilDestroyed()).subscribe(r => {
      if (r.ok) this.salaUnida.emit({ codigo: r.codigo, sala: r.sala });
    });
    // Escucha cualquier tipo de error emitido por el socket relacionado con salas (ej. sala llena, código inválido)
    this.ss.onErrorSala().pipe(takeUntilDestroyed()).subscribe(r => {
      this.errorSala = r.mensaje;
      this.cargando = false;
    });
  }

  ngOnInit() {}

  // Cambia la vista del componente y limpia los posibles mensajes de error anteriores
  mostrarVista(v: 'default' | 'crear' | 'unirse') {
    this.vistaActual = v;
    this.errorSala = '';
  }

  // Valida los datos del formulario y emite la petición de creación de sala al servidor por socket
  crearSala() {
    if (!this.nombreSala.trim()) { this.errorSala = 'El nombre de la sala es requerido'; return; }
    this.cargando = true;
    this.ss.crearSala(this.nombreSala.trim(), this.tipoSala);
  }

  // Valida el código e intenta unirse a la sala emitiendo la petición al servidor por socket
  unirseSala() {
    if (!this.codigoInput.trim()) { this.errorSala = 'El código es requerido'; return; }
    this.cargando = true;
    this.ss.unirseSala(this.codigoInput.trim());
  }
}
