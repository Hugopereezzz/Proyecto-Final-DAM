// src/app/guards/auth.guard.ts
// Este archivo es un "vigilante" (guard) de Angular.
// Se encarga de proteger las rutas privadas: si alguien intenta entrar sin hacer login,
// lo redirige automaticamente a la pantalla de login.
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GameService } from '../services/game.service';
export const authGuard: CanActivateFn = () => {
  const game   = inject(GameService);
  const router = inject(Router);

  return game.loggedInUser()
    ? true
    : router.createUrlTree(['/login']);
};
