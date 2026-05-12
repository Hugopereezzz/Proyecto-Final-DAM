import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { PlayerPlan } from '../models/game.models';

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
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private readonly URL_SERVIDOR = 'http://localhost:3000';

  constructor() {
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

  conectar(nombreUsuario: string): void {
    if (this.socket.connected) {
      this.socket.emit('identificar', nombreUsuario);
      return;
    }
    this.socket.once('connect', () => {
      console.log('Conectado al servidor Socket.io');
      this.socket.emit('identificar', nombreUsuario);
    });
    this.socket.connect();
  }

  desconectar(): void {
    if (this.socket.connected) this.socket.disconnect();
  }

  estaConectado(): boolean { return this.socket.connected; }

  getMiSocketId(): string { return this.socket.id ?? ''; }

  // ============================================================
  // GESTIÓN DE SALAS
  // ============================================================

  crearSala(nombre: string, tipo: 'publica' | 'privada'): void {
    this.socket.emit('crear-sala', { nombre, tipo });
  }

  onSalaCreada(): Observable<{ ok: boolean; codigo: string; sala: Sala }> {
    return new Observable(observer => {
      this.socket.on('sala-creada', (data) => observer.next(data));
    });
  }

  unirseSala(codigo: string): void { this.socket.emit('unirse-sala', { codigo }); }

  onSalaUnido(): Observable<{ ok: boolean; codigo: string; sala: Sala }> {
    return new Observable(observer => {
      this.socket.on('sala-unido', (data) => observer.next(data));
    });
  }

  onSalaActualizada(): Observable<Sala> {
    return new Observable(observer => {
      this.socket.on('sala-actualizada', (sala) => observer.next(sala));
    });
  }

  onErrorSala(): Observable<{ mensaje: string }> {
    return new Observable(observer => {
      this.socket.on('error-sala', (error) => observer.next(error));
    });
  }

  cambiarListo(): void { this.socket.emit('cambiar-listo'); }

  salirSala(): void { this.socket.emit('salir-sala'); }

  // ============================================================
  // SALAS PÚBLICAS
  // ============================================================

  pedirSalas(): void { this.socket.emit('pedir-salas'); }

  onSalasActualizadas(): Observable<SalaPublica[]> {
    return new Observable(observer => {
      this.socket.on('salas-actualizadas', (salas) => observer.next(salas));
    });
  }

  // ============================================================
  // CHAT GLOBAL
  // ============================================================

  enviarMensajeGlobal(contenido: string): void { this.socket.emit('chat-global', { contenido }); }

  onMensajeGlobal(): Observable<MensajeChat> {
    return new Observable(observer => {
      this.socket.on('mensaje-global', (msg) => observer.next(msg));
    });
  }

  // ============================================================
  // CHAT DE SALA
  // ============================================================

  enviarMensajeSala(contenido: string): void { this.socket.emit('chat-sala', { contenido }); }

  onMensajeSala(): Observable<MensajeChat> {
    return new Observable(observer => {
      const handler = (msg: any) => observer.next(msg);
      this.socket.on('mensaje-sala', handler);
      return () => this.socket.off('mensaje-sala', handler);
    });
  }

  // ============================================================
  // EVENTOS DE JUEGO – Lobby/Sala
  // ============================================================

  iniciarJuego(): void { this.socket.emit('iniciar-juego'); }

  onJuegoIniciado(): Observable<any> {
    return new Observable(observer => {
      const handler = (data: any) => observer.next(data);
      this.socket.on('juego-iniciado', handler);
      return () => this.socket.off('juego-iniciado', handler);
    });
  }

  seleccionarFaccion(faccionId: string): void { this.socket.emit('seleccionar-faccion', faccionId); }

  onJugadorEligioFaccion(): Observable<{ socketId: string; nombre: string; faccionId: string }> {
    return new Observable(observer => {
      const handler = (data: any) => observer.next(data);
      this.socket.on('jugador-eligio-faccion', handler);
      return () => this.socket.off('jugador-eligio-faccion', handler);
    });
  }

  comenzarBatalla(datos: any): void { this.socket.emit('comenzar-batalla', datos); }

  onBatallaComenzada(): Observable<any> {
    return new Observable(observer => {
      const handler = (datos: any) => observer.next(datos);
      this.socket.on('batalla-comenzada', handler);
      return () => this.socket.off('batalla-comenzada', handler);
    });
  }

  // ============================================================
  // EVENTOS DE JUEGO – Sistema de rondas simultáneas
  // ============================================================

  /**
   * El jugador envía su plan de ronda al servidor.
   * El servidor lo reenvía a todos cuando todos hayan confirmado (o timer expire).
   */
  enviarPlan(actorIdx: number, plan: PlayerPlan): void {
    if (!this.socket.connected) {
      console.error('No se puede enviar plan: socket desconectado.');
      return;
    }
    console.log('Enviando plan al servidor:', { actorIdx, plan });
    this.socket.emit('enviar-plan', { actorIdx, plan });
  }

  /**
   * Observable que emite cuando el servidor confirma que UN jugador envió su plan.
   * Payload: { actorIdx, plan } — permite mostrar "✅ LISTO" sin revelar el plan completo.
   */
  onPlanRecibido(): Observable<{ actorIdx: number; plan: PlayerPlan }> {
    return new Observable(observer => {
      const handler = (data: any) => observer.next(data);
      this.socket.on('plan-recibido', handler);
      return () => this.socket.off('plan-recibido', handler);
    });
  }

  /**
   * Observable que emite cuando el servidor ha resuelto la ronda.
   * Payload: { results: RoundResult[], fighters: Fighter[] }
   * En multiplayer, el servidor es la fuente de verdad de la resolución.
   */
  onRondaResuelta(): Observable<any> {
    return new Observable(observer => {
      const handler = (data: any) => observer.next(data);
      this.socket.on('ronda-resuelta', handler);
      return () => this.socket.off('ronda-resuelta', handler);
    });
  }

  // Kept for backward-compat (surrender via old action system)
  realizarAccion(accion: { abilityId: string; targetIdx: number; extra?: any }): void {
    if (!this.socket.connected) {
      console.error('No se puede emitir acción. Socket desconectado.');
      return;
    }
    this.socket.emit('realizar-accion', accion);
  }

  onAccionRecibida(): Observable<{ abilityId: string; targetIdx: number; extra?: any }> {
    return new Observable(observer => {
      const handler = (accion: any) => observer.next(accion);
      this.socket.on('accion-recibida', handler);
      return () => this.socket.off('accion-recibida', handler);
    });
  }
}
