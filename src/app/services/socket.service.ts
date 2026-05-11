import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

// Interfaz que representa un jugador dentro de una sala
export interface Jugador {
  socketId: string;
  nombre: string;
  listo: boolean;
}

// Interfaz que representa el estado completo de una sala
export interface Sala {
  nombre: string;
  tipo: 'publica' | 'privada';
  host: string;
  maxJugadores: number;
  jugadores: Jugador[];
}

// Interfaz para las salas públicas en la lista del lobby
export interface SalaPublica {
  codigo: string;
  nombre: string;
  jugadoresActuales: number;
  maxJugadores: number;
}

// Interfaz para los mensajes de chat
export interface MensajeChat {
  remitente: string;
  contenido: string;
  tipo: 'usuario' | 'sistema';
  timestamp?: string;
}

@Injectable({
  providedIn: 'root' // Disponible en toda la aplicación (singleton)
})
export class SocketService {
  // Conexión al servidor Socket.io en el puerto 3000
  private socket: Socket;
  private readonly URL_SERVIDOR = 'http://localhost:3000';

  constructor() {
    // Inicializar la conexión al servidor (sin conectar automáticamente)
    this.socket = io(this.URL_SERVIDOR, { autoConnect: false });
  }

  // ============================================================
  // UTILIDADES INTERNAS (Para que el código sea más simple)
  // ============================================================

  /**
   * Método auxiliar para "escuchar" eventos del servidor de forma sencilla.
   * Transforma un evento de Socket.io en un Observable de Angular.
   */
  private escuchar<T>(evento: string): Observable<T> {
    return new Observable<T>(observer => {
      this.socket.on(evento, (data: T) => observer.next(data));
    });
  }

  // ============================================================
  // CONEXIÓN / DESCONEXIÓN
  // ============================================================

  /**
   * Conecta al servidor y le dice quién es el usuario.
   */
  conectar(nombreUsuario: string): void {
    if (!this.socket.connected) {
      this.socket.connect();
      this.socket.emit('identificar', nombreUsuario);
    }
  }

  desconectar(): void {
    if (this.socket.connected) this.socket.disconnect();
  }

  estaConectado(): boolean {
    return this.socket.connected;
  }

  getMiSocketId(): string {
    return this.socket.id ?? '';
  }

  // ============================================================
  // GESTIÓN DE SALAS (Crear, Unirse, Estado)
  // ============================================================

  crearSala(nombre: string, tipo: 'publica' | 'privada'): void {
    this.socket.emit('crear-sala', { nombre, tipo });
  }

  onSalaCreada() { return this.escuchar<{ ok: boolean; codigo: string; sala: Sala }>('sala-creada'); }

  unirseSala(codigo: string): void {
    this.socket.emit('unirse-sala', { codigo });
  }

  onSalaUnido() { return this.escuchar<{ ok: boolean; codigo: string; sala: Sala }>('sala-unido'); }

  onSalaActualizada() { return this.escuchar<Sala>('sala-actualizada'); }

  onErrorSala() { return this.escuchar<{ mensaje: string }>('error-sala'); }

  cambiarListo(): void { this.socket.emit('cambiar-listo'); }

  salirSala(): void { this.socket.emit('salir-sala'); }

  // ============================================================
  // SALAS PÚBLICAS (Lobby)
  // ============================================================

  pedirSalas(): void { this.socket.emit('pedir-salas'); }

  onSalasActualizadas() { return this.escuchar<SalaPublica[]>('salas-actualizadas'); }

  // ============================================================
  // CHATS (Global y de Sala)
  // ============================================================

  enviarMensajeGlobal(contenido: string): void {
    this.socket.emit('chat-global', { contenido });
  }

  onMensajeGlobal() { return this.escuchar<MensajeChat>('mensaje-global'); }

  enviarMensajeSala(contenido: string): void {
    this.socket.emit('chat-sala', { contenido });
  }

  onMensajeSala() { return this.escuchar<MensajeChat>('mensaje-sala'); }
}
