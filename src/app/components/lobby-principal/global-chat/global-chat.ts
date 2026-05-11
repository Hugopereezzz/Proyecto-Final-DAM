import { Component, inject, input, output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService, MensajeChat } from '../../../services/socket.service';
import { Subscription } from 'rxjs';

/**
 * Componente GlobalChat: Chat en tiempo real para todos los usuarios conectados.
 * Se comunica con el servidor Socket.io para enviar y recibir mensajes globales.
 */
@Component({
  selector: 'app-global-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './global-chat.html',
  styleUrl: './global-chat.css',
})
export class GlobalChatComponent implements OnInit, OnDestroy {
  private socketService = inject(SocketService);
  private subs: Subscription[] = [];

  // Lista de mensajes recibidos en el chat global
  mensajes: MensajeChat[] = [];

  // Texto del mensaje que el usuario está escribiendo
  nuevoMensaje = '';

  ngOnInit(): void {
    // Escuchamos los mensajes que llegan del servidor
    this.subs.push(
      this.socketService.onMensajeGlobal().subscribe(msg => {
        this.mensajes.push(msg); // Añadimos el mensaje a la lista
        this.scrollChat(); // Bajamos el scroll para ver el mensaje nuevo
      })
    );
  }

  ngOnDestroy(): void {
    // Cerramos la escucha al cerrar el componente
    this.subs.forEach(s => s.unsubscribe());
  }

  /**
   * Envía el mensaje escrito.
   */
  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim()) return;
    this.socketService.enviarMensajeGlobal(this.nuevoMensaje.trim());
    this.nuevoMensaje = ''; // Limpiamos la caja de texto
  }

  /**
   * Permite enviar al pulsar la tecla Enter.
   */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  /**
   * Baja el scroll del chat al final automáticamente.
   */
  private scrollChat(): void {
    setTimeout(() => {
      const chatBox = document.querySelector('.chat-messages');
      if (chatBox) {
        chatBox.scrollTop = chatBox.scrollHeight;
      }
    }, 100);
  }
}
