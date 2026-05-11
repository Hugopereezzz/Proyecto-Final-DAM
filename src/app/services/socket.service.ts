import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';

// Interfaz que representa un jugador dentro de una sala
export interface Jugador {
  socketId: string;
  nombre: string;
  listo: boolean;
  faccionId?: string;
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
    // Inicializar la conexión al servidor
    this.socket = io(this.URL_SERVIDOR, { 
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
  }

  // ============================================================
  // CONEXIÓN / DESCONEXIÓN
  // ============================================================

  /**
   * Conecta al servidor Socket.io e identifica al usuario.
   * @param nombreUsuario Nombre del jugador a identificar.
   */
  conectar(nombreUsuario: string): void {
    if (this.socket.connected) {
      this.socket.emit('identificar', nombreUsuario);
      return;
    }

    // Configurar identificación al conectar
    this.socket.once('connect', () => {
      console.log('Conectado al servidor Socket.io');
      this.socket.emit('identificar', nombreUsuario);
    });

    this.socket.connect();
  }

  /**
   * Desconecta al usuario del servidor Socket.io.
   */
  desconectar(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  /**
   * Devuelve true si hay conexión activa con el servidor.
   */
  estaConectado(): boolean {
    return this.socket.connected;
  }

  /**
   * Devuelve el ID de socket del cliente actual.
   */
  getMiSocketId(): string {
    return this.socket.id ?? '';
  }

  // ============================================================
  // GESTIÓN DE SALAS
  // ============================================================

  /**
   * Emite la petición de crear una sala al servidor.
   * @param nombre Nombre de la sala.
   * @param tipo 'publica' o 'privada'.
   */
  crearSala(nombre: string, tipo: 'publica' | 'privada'): void {
    this.socket.emit('crear-sala', { nombre, tipo });
  }

  /**
   * Observable que se emite cuando el servidor confirma la creación de la sala.
   * Devuelve el código único generado y el estado inicial de la sala.
   */
  onSalaCreada(): Observable<{ ok: boolean; codigo: string; sala: Sala }> {
    return new Observable(observer => {
      this.socket.on('sala-creada', (data) => observer.next(data));
    });
  }

  /**
   * Emite la petición de unirse a una sala usando su código.
   * @param codigo Código único de la sala.
   */
  unirseSala(codigo: string): void {
    this.socket.emit('unirse-sala', { codigo });
  }

  /**
   * Observable que se emite cuando el servidor confirma que el jugador se unió a la sala.
   */
  onSalaUnido(): Observable<{ ok: boolean; codigo: string; sala: Sala }> {
    return new Observable(observer => {
      this.socket.on('sala-unido', (data) => observer.next(data));
    });
  }

  /**
   * Observable que se emite cuando el estado de la sala cambia (jugador nuevo, jugador listo, etc.).
   */
  onSalaActualizada(): Observable<Sala> {
    return new Observable(observer => {
      this.socket.on('sala-actualizada', (sala) => observer.next(sala));
    });
  }

  /**
   * Observable para errores relacionados con la sala (código incorrecto, sala llena, etc.).
   */
  onErrorSala(): Observable<{ mensaje: string }> {
    return new Observable(observer => {
      this.socket.on('error-sala', (error) => observer.next(error));
    });
  }

  /**
   * Alterna el estado "Listo" del jugador en la sala actual.
   */
  cambiarListo(): void {
    this.socket.emit('cambiar-listo');
  }

  /**
   * Emite la petición de salir de la sala actual.
   */
  salirSala(): void {
    this.socket.emit('salir-sala');
  }

  // ============================================================
  // SALAS PÚBLICAS
  // ============================================================

  /**
   * Solicita al servidor la lista actualizada de salas públicas.
   */
  pedirSalas(): void {
    this.socket.emit('pedir-salas');
  }

  /**
   * Observable que se emite cuando la lista de salas públicas se actualiza.
   */
  onSalasActualizadas(): Observable<SalaPublica[]> {
    return new Observable(observer => {
      this.socket.on('salas-actualizadas', (salas) => observer.next(salas));
    });
  }

  // ============================================================
  // CHAT GLOBAL
  // ============================================================

  /**
   * Envía un mensaje al chat global (visible para todos los usuarios).
   * @param contenido Texto del mensaje.
   */
  enviarMensajeGlobal(contenido: string): void {
    this.socket.emit('chat-global', { contenido });
  }

  /**
   * Observable que emite mensajes del chat global a medida que llegan.
   */
  onMensajeGlobal(): Observable<MensajeChat> {
    return new Observable(observer => {
      this.socket.on('mensaje-global', (msg) => observer.next(msg));
    });
  }

  // ============================================================
  // CHAT DE SALA
  // ============================================================

  /**
   * Envía un mensaje al chat privado de la sala actual.
   * @param contenido Texto del mensaje.
   */
  enviarMensajeSala(contenido: string): void {
    this.socket.emit('chat-sala', { contenido });
  }

  /**
   * Observable que emite mensajes del chat de la sala.
   */
  onMensajeSala(): Observable<MensajeChat> {
    return new Observable(observer => {
      const handler = (msg: any) => observer.next(msg);
      this.socket.on('mensaje-sala', handler);
      return () => this.socket.off('mensaje-sala', handler);
    });
  }

  // ============================================================
  // EVENTOS DE JUEGO
  // ============================================================

  iniciarJuego(): void {
    this.socket.emit('iniciar-juego');
  }

  onJuegoIniciado(): Observable<void> {
    return new Observable(observer => {
      const handler = () => observer.next();
      this.socket.on('juego-iniciado', handler);
      return () => this.socket.off('juego-iniciado', handler);
    });
  }

  seleccionarFaccion(faccionId: string): void {
    this.socket.emit('seleccionar-faccion', faccionId);
  }

  onJugadorEligioFaccion(): Observable<{ socketId: string, nombre: string, faccionId: string }> {
    return new Observable(observer => {
      const handler = (data: any) => observer.next(data);
      this.socket.on('jugador-eligio-faccion', handler);
      return () => this.socket.off('jugador-eligio-faccion', handler);
    });
  }

  realizarAccion(accion: { abilityId: string, targetIdx: number, extra?: any }): void {
    if (!this.socket.connected) {
      console.error('ERROR: No se puede emitir acción. Socket desconectado.');
      return;
    }
    console.log('Emitiendo acción al servidor:', accion);
    this.socket.emit('realizar-accion', accion);
  }

  onAccionRecibida(): Observable<{ abilityId: string, targetIdx: number, extra?: any }> {
    return new Observable(observer => {
      const handler = (accion: any) => {
        console.log('Recibida acción del servidor:', accion);
        observer.next(accion);
      };
      this.socket.on('accion-recibida', handler);
      return () => this.socket.off('accion-recibida', handler);
    });
  }

  comenzarBatalla(datos: any): void {
    this.socket.emit('comenzar-batalla', datos);
  }

  onBatallaComenzada(): Observable<any> {
    return new Observable(observer => {
      const handler = (datos: any) => observer.next(datos);
      this.socket.on('batalla-comenzada', handler);
      return () => this.socket.off('batalla-comenzada', handler);
    });
  }
}
