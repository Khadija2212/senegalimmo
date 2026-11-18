import { ErrorHandler, Injectable } from '@angular/core';
import { SENTRY_DSN } from '../config/jetons';

type Sentry = typeof import('@sentry/angular');

/**
 * Remplace le gestionnaire d'erreurs d'Angular : l'erreur reste affichée dans la console
 * et part chez Sentry quand un DSN est configuré. Le SDK n'est chargé qu'à la première
 * erreur, pour ne pas alourdir le premier chargement du site.
 */
@Injectable()
export class SuiviErreurs implements ErrorHandler {
  private sentry: Promise<Sentry> | null = null;

  handleError(erreur: unknown): void {
    console.error(erreur);
    if (!SENTRY_DSN) return;
    this.charger()
      .then((s) => s.captureException(erreur))
      .catch(() => undefined);
  }

  private charger(): Promise<Sentry> {
    this.sentry ??= import('@sentry/angular').then((s) => {
      s.init({ dsn: SENTRY_DSN, dataCollection: { userInfo: false } });
      return s;
    });
    return this.sentry;
  }
}
