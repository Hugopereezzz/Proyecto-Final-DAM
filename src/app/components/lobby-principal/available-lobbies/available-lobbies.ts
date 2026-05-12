import { Component, inject, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SocketService, SalaPublica, Sala } from '../../../services/socket.service';

@Component({
  selector: 'app-available-lobbies',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './available-lobbies.html',
  styleUrls: ['./available-lobbies.css']
})
export class AvailableLobbiesComponent implements OnInit {
  ss = inject(SocketService);
  salaUnida = output<{ codigo: string; sala: Sala }>();
  salasPublicas: SalaPublica[] = [];

  constructor() {
    this.ss.onSalasActualizadas().pipe(takeUntilDestroyed()).subscribe(s => this.salasPublicas = s);
    this.ss.onSalaUnido().pipe(takeUntilDestroyed()).subscribe(r => {
      if (r.ok) this.salaUnida.emit({ codigo: r.codigo, sala: r.sala });
    });
  }

  ngOnInit() { this.ss.pedirSalas(); }

  unirseASala(codigo: string) { this.ss.unirseSala(codigo); }

  refrescar() { this.ss.pedirSalas(); }
}
