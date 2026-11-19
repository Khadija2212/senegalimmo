import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, catchError, map, merge, of, switchMap } from 'rxjs';
import { NotificationsService } from '../../core/services/notifications';
import { SessionService } from '../../core/session/session';
import { sondageVisible } from '../messages/sondage';

const PERIODE_MS = 60_000;

/**
 * Nombre de notifications non lues du compte connecté, relu chaque minute
 * tant que la page est visible. Remis à zéro à la déconnexion.
 */
@Injectable({ providedIn: 'root' })
export class CompteurNotifications {
  private readonly service = inject(NotificationsService);
  private readonly relire = new Subject<void>();
  private readonly valeur = signal(0);

  readonly nonLues = this.valeur.asReadonly();

  constructor() {
    const doc = inject(DOCUMENT);
    toObservable(inject(SessionService).connecte)
      .pipe(
        switchMap((connecte) =>
          connecte
            ? merge(of(undefined), sondageVisible(PERIODE_MS, doc), this.relire).pipe(
                switchMap(() =>
                  this.service.lister().pipe(
                    map((r) => r.non_lues),
                    catchError(() => EMPTY),
                  ),
                ),
              )
            : of(0),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((n) => this.valeur.set(n));
  }

  /** À appeler après avoir marqué des notifications comme lues. */
  rafraichir(): void {
    this.relire.next();
  }
}
