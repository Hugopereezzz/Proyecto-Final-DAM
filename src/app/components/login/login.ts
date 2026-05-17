// src/app/components/login/login.ts
// Este archivo representa la pantalla de inicio de sesion y registro.
// Se encarga de recoger las credenciales del usuario y enviarlas al AuthService.
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-wrap">
      <div class="card">
        <div class="head">
          <h1>PULSO <span>GLOBAL</span></h1>
          <h2>{{ isReg() ? 'CREAR CUENTA' : 'LOGIN' }}</h2>
        </div>
        <form (submit)="onSubmit(); $event.preventDefault()" class="form">
          <div class="field"><label>USUARIO</label><input [(ngModel)]="u" name="u" [disabled]="loading()" placeholder="Nombre"></div>
          <div class="field"><label>PASSWORD</label><input type="password" [(ngModel)]="p" name="p" [disabled]="loading()" placeholder="••••"></div>
          @if (err()) { <div class="err" [class.ok]="err().includes('exitoso')">{{ err() }}</div> }
          <button type="submit" class="btn" [disabled]="loading()">{{ loading() ? 'ESPERA...' : (isReg() ? 'REGISTRAR' : 'ENTRAR') }}</button>
          <button type="button" class="link" (click)="toggle()">{{ isReg() ? '¿YA TIENES CUENTA?' : 'CREAR CUENTA' }}</button>
        </form>
      </div>
      <div class="status">v1.0.4-STABLE | SERVER: ONLINE</div>
    </div>
  `,
  styles: [`
    .login-wrap { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: #050a0f; font-family: Outfit, sans-serif; }
    .card { background: rgba(13,20,28,0.9); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 40px; width: 100%; max-width: 400px; box-shadow: 0 20px 50px #000; }
    .head { text-align: center; margin-bottom: 30px; }
    h1 { font-size: 2rem; color: #fff; margin: 0; letter-spacing: 2px; }
    h1 span { color: #00d4ff; text-shadow: 0 0 10px rgba(0,212,255,0.5); }
    h2 { font-size: 1rem; color: rgba(255,255,255,0.5); margin-top: 5px; }
    .form { display: flex; flex-direction: column; gap: 20px; }
    .field { display: flex; flex-direction: column; gap: 5px; }
    label { font-size: 0.7rem; color: #00d4ff; font-weight: 700; }
    input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px; color: #fff; width: 100%; box-sizing: border-box; }
    input:focus { outline: none; border-color: #00d4ff; background: rgba(255,255,255,0.1); }
    .btn { background: linear-gradient(135deg, #00d4ff, #0082ff); border: none; border-radius: 12px; padding: 14px; color: #fff; font-weight: 700; cursor: pointer; transition: .3s; }
    .btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,212,255,0.3); }
    .err { padding: 10px; border-radius: 8px; font-size: 0.8rem; background: rgba(255,71,87,0.1); color: #ff4757; border-left: 3px solid #ff4757; }
    .err.ok { background: rgba(46,204,113,0.1); color: #2ecc71; border-left-color: #2ecc71; }
    .link { background: none; border: none; color: #00d4ff; font-size: 0.8rem; cursor: pointer; }
    .status { position: absolute; bottom: 20px; color: rgba(255,255,255,0.2); font-size: 0.7rem; }
  `]
})
export class LoginComponent {
  // Servicio de Autenticación inyectado para comunicarse con la API de login/registro del backend
  private readonly auth = inject(AuthService);
  // Servicio de Juego global para actualizar el estado del usuario cuando inicie sesión con éxito
  private readonly game = inject(GameService);

  // Señal que determina si estamos en la vista de Registro (true) o en la de Login (false)
  isReg    = signal(false);
  // Campo reactivo (Model-binding) que almacena el nombre del usuario introducido
  u        = '';
  // Campo reactivo (Model-binding) que almacena la contraseña introducida
  p        = '';
  // Señal reactiva para gestionar y mostrar los mensajes de error o éxito
  err      = signal('');
  // Bloquea el formulario y los botones mostrando "Espera..." para evitar doble envío en peticiones lentas
  loading  = signal(false);

  // Cambia cómodamente entre los modos de Login y Registro de la tarjeta limpiando los errores previos
  toggle(): void  { this.isReg.update(v => !v); this.err.set(''); }
  
  // Enrutador de envío del formulario que decide la acción basándose en la vista actual
  onSubmit(): void { this.isReg() ? this.onReg() : this.onLog(); }

  // Envía la petición HTTP de inicio de sesión. Si el backend retorna 200, guarda el usuario.
  // Si devuelve 409, informa que ya tiene una pestaña con sesión activa para impedir concurrencia.
  onLog(): void {
    if (!this.u || !this.p) return this.err.set('Completa los campos');
    this.loading.set(true);
    this.err.set('');
    this.auth.login(this.u, this.p).subscribe({
      next:  (u) => { this.loading.set(false); this.game.onLoginSuccess(u.nombreUsuario); },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 409) {
          this.err.set('⚠️ Este usuario ya está conectado en otra ventana');
        } else {
          this.err.set('Credenciales incorrectas');
        }
      }
    });
  }

  // Envía los datos para crear un usuario nuevo en la base de datos MySQL.
  // Tras el éxito, bloquea la carga y redirige de vuelta al login para que inicie sesión normalmente.
  onReg(): void {
    if (!this.u || !this.p) return this.err.set('Completa los campos');
    this.loading.set(true);
    this.err.set('');
    this.auth.registrar({ nombreUsuario: this.u, contrasena: this.p }).subscribe({
      next:  () => { this.loading.set(false); this.isReg.set(false); this.err.set('¡Registro exitoso!'); },
      error: () => { this.loading.set(false); this.err.set('Error en registro'); }
    });
  }
}
