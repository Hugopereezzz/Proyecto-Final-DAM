// src/app/services/auth.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, throwError, catchError } from 'rxjs';

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
 * Servicio encargado de la comunicación con la API de usuarios del backend.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http    = inject(HttpClient);
  private readonly router  = inject(Router);
  private readonly apiUrl  = 'http://localhost:8080/api/usuarios';

  readonly currentUser = signal<Usuario | null>(null);

  /**
   * Envía las credenciales al servidor para validar el acceso.
   * Almacena el sessionToken recibido para usarlo en el logout.
   * Lanza un error con status 409 si el usuario ya está conectado.
   */
  login(nombreUsuario: string, contrasena: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/login`, { nombreUsuario, contrasena }).pipe(
      tap(usuario => this.currentUser.set(usuario)),
      catchError((err: HttpErrorResponse) => throwError(() => err))
    );
  }

  /** Envía los datos de un nuevo usuario al servidor para su creación. */
  registrar(usuario: Omit<Usuario, 'id' | 'victorias'>): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/registro`, usuario);
  }

  /**
   * Cierra la sesión en el backend (borra el sessionToken) y limpia el estado local.
   */
  logout(): Observable<any> {
    const token = this.currentUser()?.sessionToken;
    this.currentUser.set(null);
    if (!token) {
      return new Observable(obs => obs.complete());
    }
    return this.http.post(`${this.apiUrl}/logout`, { sessionToken: token });
  }

  /** Limpia el estado de autenticación local sin llamar al backend. */
  clearSession(): void {
    this.currentUser.set(null);
  }

  /** Obtiene el ranking global de los 10 mejores jugadores. */
  obtenerRanking(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.apiUrl}/ranking`);
  }

  incrementarVictorias(username: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/incrementar-victorias/${username}`, {});
  }
}
