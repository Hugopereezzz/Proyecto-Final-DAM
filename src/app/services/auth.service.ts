// src/app/services/auth.service.ts
import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, interval, tap, throwError, catchError, switchMap, EMPTY } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

/**
 * Interfaz que define la estructura de un objeto Usuario en el frontend.
 * Coincide con el modelo definido en el backend.
 */
export interface Usuario {
  id?: number;
  nombreUsuario: string;
  contrasena: string;
  email?: string;
  victorias?: number;
  sessionToken?: string;
}

/**
 * Servicio encargado de la comunicación con la API de usuarios del backend
 * y del control del ciclo de vida de la sesión activa.
 *
 * Mecanismo de refresco:
 *  - Cada 2 minutos se llama a POST /refresh-session para extender el token 3 min más.
 *  - Si el backend devuelve 401 (token caducado), se fuerza logout local.
 *  - Al hacer logout explícito se cancela el intervalo y se borra el token en BD.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http        = inject(HttpClient);
  private readonly router      = inject(Router);
  private readonly destroyRef  = inject(DestroyRef);
  private readonly apiUrl      = 'http://localhost:8080/api/usuarios';
  private readonly statsUrl    = 'http://localhost:8080/api/estadisticas';

  /** Estado reactivo del usuario autenticado. */
  readonly currentUser = signal<Usuario | null>(this._loadUserFromStorage());

  /** Suscripción al intervalo de refresco de sesión. */
  private refreshSub: Subscription | null = null;

  constructor() {
    if (this.currentUser()) {
      this._iniciarRefrescoSesion();
    }
  }

  private _loadUserFromStorage(): Usuario | null {
    const saved = localStorage.getItem('usuario_sesion');
    return saved ? JSON.parse(saved) : null;
  }

  // ─── Constantes de timing ─────────────────────────────────────────
  /** Cada cuántos ms se envía el ping de refresco al backend (2 minutos). */
  private static readonly REFRESH_INTERVAL_MS = 2 * 60 * 1000;

  // ─── Login ────────────────────────────────────────────────────────

  /**
   * Envía las credenciales al servidor para validar el acceso.
   * - Almacena el sessionToken recibido.
   * - Lanza un error con status 409 si el usuario ya está conectado.
   * - Inicia el heartbeat de refresco de sesión.
   */
  login(nombreUsuario: string, contrasena: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/login`, { nombreUsuario, contrasena }).pipe(
      tap(usuario => {
        this.currentUser.set(usuario);
        localStorage.setItem('usuario_sesion', JSON.stringify(usuario));
        this._iniciarRefrescoSesion();
      }),
      catchError((err: HttpErrorResponse) => throwError(() => err))
    );
  }

  // ─── Registro ─────────────────────────────────────────────────────

  /** Envía los datos de un nuevo usuario al servidor para su creación. */
  registrar(usuario: Omit<Usuario, 'id' | 'victorias'>): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/registro`, usuario);
  }

  // ─── Logout ───────────────────────────────────────────────────────

  /**
   * Cierra la sesión:
   *  1. Detiene el intervalo de refresco.
   *  2. Llama al backend para borrar el token en BD de forma inmediata.
   *  3. Limpia el estado local.
   */
  logout(): Observable<any> {
    this._detenerRefrescoSesion();
    const token = this.currentUser()?.sessionToken;
    this.currentUser.set(null);
    localStorage.removeItem('usuario_sesion');

    if (!token) {
      return new Observable(obs => { obs.next(null); obs.complete(); });
    }
    return this.http.post(`${this.apiUrl}/logout`, { sessionToken: token });
  }

  /** Limpia el estado de autenticación local sin llamar al backend. */
  clearSession(): void {
    this._detenerRefrescoSesion();
    this.currentUser.set(null);
    localStorage.removeItem('usuario_sesion');
  }

  // ─── Ranking / victorias ──────────────────────────────────────────

  /** Obtiene el ranking global de los 10 mejores jugadores. */
  obtenerRanking(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/ranking`);
  }

  incrementarVictorias(username: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/incrementar-victorias/${username}`, {});
  }

  obtenerEstadisticas(nickname: string): Observable<any> {
    return this.http.get<any>(`${this.statsUrl}/${nickname}`);
  }

  registrarPartida(partida: any): Observable<void> {
    return this.http.post<void>(`${this.statsUrl}/registrar`, partida);
  }

  // ─── Heartbeat de sesión (privado) ────────────────────────────────

  /**
   * Inicia un intervalo que llama a POST /refresh-session cada 2 minutos.
   * Si el backend responde con 401, fuerza logout y redirige al login.
   */
  private _iniciarRefrescoSesion(): void {
    this._detenerRefrescoSesion(); // Cancelar cualquier intervalo previo

    this.refreshSub = interval(AuthService.REFRESH_INTERVAL_MS)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          const token = this.currentUser()?.sessionToken;
          if (!token) return EMPTY;
          return this.http
            .post(`${this.apiUrl}/refresh-session`, { sessionToken: token })
            .pipe(
              catchError((err: HttpErrorResponse) => {
                if (err.status === 401) {
                  // Sesión caducada en el servidor: forzar logout local
                  console.warn('[AuthService] Sesión caducada detectada en refresco. Cerrando sesión.');
                  this._detenerRefrescoSesion();
                  this.currentUser.set(null);
                  this.router.navigate(['/login']);
                }
                return EMPTY;
              })
            );
        })
      )
      .subscribe({
        next: () => console.debug('[AuthService] Sesión renovada correctamente.'),
      });
  }

  /** Cancela el intervalo de refresco si está activo. */
  private _detenerRefrescoSesion(): void {
    if (this.refreshSub && !this.refreshSub.closed) {
      this.refreshSub.unsubscribe();
      this.refreshSub = null;
    }
  }
}
