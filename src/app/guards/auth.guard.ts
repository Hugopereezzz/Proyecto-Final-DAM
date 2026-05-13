// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GameService } from '../services/game.service';

/**
 * Guard funcional que protege las rutas autenticadas.
 * Redirige a /login si no hay usuario en sesión.
 */
export const authGuard: CanActivateFn = () => {
  const game   = inject(GameService);
  const router = inject(Router);

  return game.loggedInUser()
    ? true
    : router.createUrlTree(['/login']);
};
