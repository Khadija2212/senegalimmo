import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CHEMIN_CONNEXION } from './contexte-connexion';
import { SessionService } from './session';

/** L'espace client demande un compte client : sinon connexion, ou retour à l'accueil. */
export const gardeClient: CanActivateFn = (_route, etat) => {
  const session = inject(SessionService);
  const router = inject(Router);
  if (!session.connecte()) {
    return router.createUrlTree([CHEMIN_CONNEXION], { queryParams: { retour: etat.url } });
  }
  return session.estClient() ? true : router.createUrlTree(['/']);
};
