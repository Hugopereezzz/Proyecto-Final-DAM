import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Partida {
  id?: number;
  estado: string;
  numeroRonda: number;
  participantes: ParticipantePartida[];
}

export interface ParticipantePartida {
  usuario: { id: number };
  faccion: { id: number };
  vida: number;
  posicion?: number;
}

@Injectable({
  providedIn: 'root'
})
export class MatchService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/partidas';

  guardarPartida(partida: Partida): Observable<Partida> {
    return this.http.post<Partida>(this.apiUrl, partida);
  }

  obtenerHistorial(): Observable<Partida[]> {
    return this.http.get<Partida[]>(this.apiUrl);
  }
}
