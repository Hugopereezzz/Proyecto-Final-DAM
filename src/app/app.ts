import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { LobbyPrincipalComponent } from './components/lobby-principal/lobby-principal';

/**
 * Clase principal de la aplicación.
 * Gestiona si el usuario está en la pantalla de login o en el lobby.
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoginComponent, LobbyPrincipalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ProyectoFinal');
  isLoggedIn = signal(false);
  currentUser = signal('');

  onLoginSuccess(data: {username: string}) {
    this.currentUser.set(data.username);
    this.isLoggedIn.set(true);
  }
}
