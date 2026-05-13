// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { phaseGuard } from './guards/phase.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'lobby',
    loadComponent: () =>
      import('./components/lobby-principal/lobby-principal').then(m => m.LobbyPrincipalComponent),
    canActivate: [authGuard]
  },
  {
    path: 'sala/:id',
    loadComponent: () =>
      import('./components/sala-juego/sala-juego').then(m => m.SalaJuegoComponent),
    canActivate: [authGuard]
  },
  {
    path: 'batalla',
    loadComponent: () =>
      import('./components/battle-arena/battle-arena.component').then(m => m.BattleArenaComponent),
    canActivate: [authGuard, phaseGuard(['planning', 'resolving'])]
  },
  {
    path: 'gameover',
    loadComponent: () =>
      import('./components/game-over/game-over.component').then(m => m.GameOverComponent),
    canActivate: [authGuard, phaseGuard(['gameover'], '/lobby')]
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];

