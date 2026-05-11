import { Component, inject, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SocketService, Sala } from '../../../services/socket.service';

@Component({
  selector: 'app-lobby-creation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lobby-creation.html',
  styleUrls: ['./lobby-creation.css']
})
export class LobbyCreationComponent implements OnInit {
  ss = inject(SocketService);
  salaUnida = output<{ codigo: string; sala: Sala }>();

  vistaActual: 'default' | 'crear' | 'unirse' = 'default';
  nombreSala = '';
  tipoSala: 'publica' | 'privada' = 'publica';
  codigoInput = '';
  errorSala = '';
  cargando = false;

  constructor() {
    this.ss.onSalaCreada().pipe(takeUntilDestroyed()).subscribe(r => {
      if (r.ok) this.salaUnida.emit({ codigo: r.codigo, sala: r.sala });
    });
    this.ss.onSalaUnido().pipe(takeUntilDestroyed()).subscribe(r => {
      if (r.ok) this.salaUnida.emit({ codigo: r.codigo, sala: r.sala });
    });
    this.ss.onErrorSala().pipe(takeUntilDestroyed()).subscribe(r => {
      this.errorSala = r.mensaje;
      this.cargando = false;
    });
  }

  ngOnInit() {}

  mostrarVista(v: 'default' | 'crear' | 'unirse') {
    this.vistaActual = v;
    this.errorSala = '';
  }

  crearSala() {
    if (!this.nombreSala.trim()) { this.errorSala = 'El nombre de la sala es requerido'; return; }
    this.cargando = true;
    this.ss.crearSala(this.nombreSala.trim(), this.tipoSala);
  }

  unirseSala() {
    if (!this.codigoInput.trim()) { this.errorSala = 'El código es requerido'; return; }
    this.cargando = true;
    this.ss.unirseSala(this.codigoInput.trim());
  }
}
