// src/app/app.ts
// Este es el componente raiz (principal) de toda la aplicacion Angular.
// Simplemente actua como el contenedor basico donde se cargan las demas pantallas.
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {}

