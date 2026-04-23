import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente LobbyPrincipal: Versión simplificada para verificar la navegación.
 */
@Component({
  selector: 'app-lobby-principal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lobby-principal.html',
  styleUrl: './lobby-principal.css'
})
export class LobbyPrincipalComponent {
  // Nombre del usuario logueado
  username = input<string>('Usuario');
}
