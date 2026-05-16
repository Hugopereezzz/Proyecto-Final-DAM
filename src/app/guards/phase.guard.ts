// src/app/guards/phase.guard.ts
// Este archivo es otro "vigilante" (guard) de Angular.
// Asegura que los jugadores solo puedan entrar a las pantallas correspondientes
// a la fase actual del juego (ej: no pueden entrar a la batalla si están en el lobby).
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GameService } from '../services/game.service';
import { GamePhase } from '../models/game.models';
export const phaseGuard = (
  allowedPhases: GamePhase[],
  redirectTo = '/lobby'
): CanActivateFn =>
  () => {
    const game   = inject(GameService);
    const router = inject(Router);

    return allowedPhases.includes(game.phase())
      ? true
      : router.createUrlTree([redirectTo]);
  };
