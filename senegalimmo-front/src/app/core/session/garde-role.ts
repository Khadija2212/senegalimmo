import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CHEMIN_CONNEXION } from './contexte-connexion';
import { Role, SessionService } from './session';

/** Accès réservé à certains rôles : sinon connexion, ou retour vers l'espace du compte. */
export function gardeRole(...roles: readonly Role[]): CanActivateFn {
  return (_route, etat) => {
    const session = inject(SessionService);
    const router = inject(Router);
    const role = session.role();
    if (!role) {
      return router.createUrlTree([CHEMIN_CONNEXION], { queryParams: { retour: etat.url } });
    }
    return roles.includes(role) ? true : router.createUrlTree([ESPACE_PAR_ROLE[role]]);
  };
}

/** Page d'accueil de l'espace de chaque rôle. */
export const ESPACE_PAR_ROLE: Readonly<Record<Role, string>> = {
  client: '/espace',
  proprietaire: '/proprietaire',
  agent: '/agent',
  administrateur: '/admin',
};
