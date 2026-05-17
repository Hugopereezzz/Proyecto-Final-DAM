// src/app/components/lobby-principal/global-chat/global-chat.ts
// Este archivo gestiona el chat publico del lobby.
// Escucha los mensajes que llegan por WebSockets y permite enviar nuevos mensajes a todos.
import { Component, inject, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SocketService, MensajeChat } from '../../../services/socket.service';

@Component({
  selector: 'app-global-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-chat.html',
  styleUrls: ['./global-chat.css']
})
export class GlobalChatComponent implements OnInit, AfterViewChecked {
  // Servicio de Sockets inyectado para la recepción y envío de mensajes
  ss = inject(SocketService);
  // Lista de mensajes que se muestran en el historial del chat
  mensajes: MensajeChat[] = [];
  // Mensaje actual que el usuario está escribiendo en el input de texto
  nuevoMensaje = '';
  // Flag interno que determina si hace falta desplazar el scroll hacia abajo al recibir un mensaje
  private scrollPending = false;

  // Obtiene una referencia directa al contenedor HTML de los mensajes para poder manipular el scroll
  @ViewChild('chatMessages') private chatMessages!: ElementRef;

  constructor() {
    // Escucha en tiempo real los mensajes del chat global que envía el servidor y los añade al historial
    this.ss.onMensajeGlobal().pipe(takeUntilDestroyed()).subscribe(m => {
      this.mensajes.push(m);
      this.scrollPending = true; // Marca que hay scroll pendiente para el siguiente ciclo
    });
  }

  ngOnInit() {}

  // Método del ciclo de vida de Angular ejecutado tras comprobar las vistas del componente.
  // Si hay un scroll pendiente y la caja existe en el DOM, se baja el scroll de manera automática.
  ngAfterViewChecked() {
    if (this.scrollPending && this.chatMessages) {
      this.chatMessages.nativeElement.scrollTop = this.chatMessages.nativeElement.scrollHeight;
      this.scrollPending = false;
    }
  }

  // Envía el mensaje escrito al servidor mediante sockets si no está vacío y limpia la caja de texto
  enviarMensaje() {
    if (!this.nuevoMensaje.trim()) return;
    this.ss.enviarMensajeGlobal(this.nuevoMensaje.trim());
    this.nuevoMensaje = '';
  }

  // Permite enviar el mensaje al pulsar la tecla 'Enter' sobre la caja de texto
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') this.enviarMensaje();
  }
}
