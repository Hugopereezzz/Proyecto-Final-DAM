import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id?: number;
  nombreUsuario: string;
  contrasena: string;
  email?: string;
}

/**
 * Servicio encargado de la comunicación con la API de usuarios del backend.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/usuarios';

  /**
   * Envía una petición de login al servidor.
   */
  login(nombreUsuario: string, contrasena: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/login`, { nombreUsuario, contrasena });
  }

  /**
   * Registra un nuevo usuario en la base de datos del servidor.
   */
  registrar(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/registro`, usuario);
  }
}
