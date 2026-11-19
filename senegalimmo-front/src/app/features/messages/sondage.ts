import { ResourceRef, Signal, linkedSignal } from '@angular/core';
import { Observable, filter, fromEvent, interval, map, merge } from 'rxjs';

/**
 * Émet toutes les `periode` millisecondes tant que la page est visible,
 * et aussitôt que l'onglet redevient visible.
 */
export function sondageVisible(periode: number, doc: Document): Observable<void> {
  const visible = (): boolean => doc.visibilityState === 'visible';
  return merge(interval(periode), fromEvent(doc, 'visibilitychange')).pipe(
    filter(visible),
    map(() => undefined),
  );
}

/**
 * Dernière valeur reçue d'une ressource relue régulièrement :
 * un rafraîchissement raté ne vide pas l'écran.
 */
export function derniereValeur<T>(r: ResourceRef<T | undefined>): Signal<T | undefined> {
  return linkedSignal<T | undefined, T | undefined>({
    source: () => (r.hasValue() ? r.value() : undefined),
    computation: (valeur, precedent) => valeur ?? precedent?.value,
  });
}
