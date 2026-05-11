# ProyectoFinal

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.24.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

//

🎮 Prompt: Arquitecto de Lógica de Combate Sincronizado
Contexto del Proyecto: Estoy desarrollando un juego de arena por turnos llamado "Guerra de Facciones". El stack es Angular 17+ (Frontend), Socket.io (Servidor de sincronización) y Spring Boot (Backend de persistencia). El juego ya tiene la interfaz (UI) y la gestión de salas, pero falta la implementación profunda de la lógica de combate.

Tu Tarea: Implementar toda la lógica interna en el GameService y sincronizarla mediante el SocketService. Debes asegurar que el estado sea consistente en todos los clientes.

Arquitectura del Estado:

Fighters (Luchadores): Cada facción tiene estadísticas: hp (Vida), shield (Escudo), ap (Puntos de Acción), energy y speed.
Habilidades: Cada luchador tiene un set de habilidades (Ataque básico, Habilidad Especial, Defensiva y Pasiva).
Sistema de Turnos: Basado en una cola de iniciativa. Solo el jugador cuyo turno está activo puede emitir acciones.
Reglas de Implementación:

Sincronización Multijugador:

Cuando un jugador realiza una acción (ej. usar habilidad), esta debe enviarse al servidor mediante socket.realizarAccion({ abilityId, targetIdx, extraData }).
Todos los clientes (incluido el emisor) deben escuchar onAccionRecibida y aplicar el efecto exactamente igual.
CRÍTICO: Los valores aleatorios (críticos, fallos, daño variable) deben generarse en un solo lugar (idealmente el Host o el Servidor) y enviarse en el extraData para evitar desincronización.
Lógica de Combate:

Daño: El daño primero reduce el shield y luego el hp.
Efectos de Estado: Implementar soporte para Buffs/Debuffs (ej. Sangrado, Escudo de Energía, Aturdimiento) que duren X turnos.
IA (Single Player): Si no hay multijugador, el GameService debe manejar una IA básica que elija objetivos y habilidades al azar.
Persistencia:

Al terminar la batalla (gameover), llama al servicio de backend para guardar el resultado de la partida y actualizar el ranking del usuario ganador.
Flujo de Datos en Angular:

Usa Signals para que la UI se actualice automáticamente.
El GameService debe ser la única fuente de verdad para el estado del tablero.
Entregables:

Método applyAction(action) que procesa cualquier habilidad.
Lógica de "Fin de Turno" que gestione regeneración de energía y expiración de efectos.
Gestión de la muerte de luchadores y condiciones de victoria.
💡 Consejos adicionales para usar este prompt:
Adjunta archivos: Si la otra IA te permite subir archivos, pásale el game.service.ts y el game.models.ts que acabamos de crear para que conozca las interfaces exactas.
Iteración: Pídele primero que implemente el sistema de daño básico y luego los efectos de estado complejos (stuns, venenos, etc.).

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
