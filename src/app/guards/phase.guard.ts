// src/app/guards/phase.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { GameService } from '../services/game.service';
import { GamePhase } from '../models/game.models';

/**
 * Guard funcional de fábrica que verifica que la fase de juego actual
 * sea una de las permitidas para la ruta.
 *
 * @param allowedPhases - Fases que permiten el acceso.
 * @param redirectTo    - Ruta a la que redirigir si la fase no coincide.
 */
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
