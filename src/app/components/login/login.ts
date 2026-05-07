import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private authService = inject(AuthService); // Inyección del servicio de autenticación

  isRegisterMode = signal(false); // Indica si estamos en modo registro o login
  username = signal(''); // Nombre de usuario vinculado al formulario
  password = signal(''); // Contraseña vinculada al formulario
  error = signal(''); // Mensaje de error o éxito para el usuario
  isLoading = signal(false); // Estado de carga durante las peticiones

  loginSuccess = output<{ username: string }>(); // Evento que se dispara al entrar con éxito

  /**
   * Cambia entre el formulario de Login y el de Registro.
   */
  toggleMode() {
    this.isRegisterMode.update(v => !v);
    this.error.set('');
  }

  /**
   * Se ejecuta al pulsar el botón del formulario.
   */
  onSubmit() {
    if (this.isRegisterMode()) {
      this.onRegister();
    } else {
      this.onLogin();
    }
  }

  /**
   * Inicia sesión llamando al backend.
   */
  onLogin() {
    // 1. Validar que los campos no estén vacíos
    if (!this.username() || !this.password()) {
      this.error.set('Por favor, rellena todos los datos.');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    // 2. Llamar al servicio de autenticación
    this.authService.login(this.username(), this.password()).subscribe({
      next: (user) => {
        this.isLoading.set(false);
        this.loginSuccess.emit({ username: user.nombreUsuario });
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set('Usuario o contraseña incorrectos.');
      }
    });
  }

  /**
   * Registra un nuevo usuario.
   */
  onRegister() {
    // 1. Validar campos
    if (!this.username() || !this.password()) {
      this.error.set('Por favor, rellena todos los datos.');
      return;
    }

    this.isLoading.set(true);
    this.error.set('');

    // 2. Crear el objeto con los datos
    const nuevoUsuario = {
      nombreUsuario: this.username(),
      contrasena: this.password()
    };

    // 3. Enviar al backend
    this.authService.registrar(nuevoUsuario).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.isRegisterMode.set(false); // Volver al modo login
        this.error.set('¡Registro exitoso! Ya puedes entrar.');
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set('Error: el nombre de usuario ya existe.');
      }
    });
  }
}
