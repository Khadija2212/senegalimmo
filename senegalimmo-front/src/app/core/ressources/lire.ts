import type { Resource } from '@angular/core';

/**
 * Valeur d'une ressource, ou `undefined` tant qu'elle n'est pas chargée.
 * `value()` lève une erreur quand le chargement a échoué : on passe par
 * `hasValue()` pour que l'écran puisse afficher son état d'erreur.
 */
export function lire<T>(ressource: Resource<T>): T | undefined {
  return ressource.hasValue() ? ressource.value() : undefined;
}
