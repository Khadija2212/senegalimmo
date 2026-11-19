import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { AbstractControl } from '@angular/forms';
import { TEXTES_CONNEXION } from './textes';

const T = TEXTES_CONNEXION;

/** Message sous un champ, seulement après une tentative d'envoi ou une sortie du champ. */
export function messageChamp(c: AbstractControl): string | null {
  if (!c.touched || !c.errors) return null;
  if (c.errors['required']) return T.requis;
  if (c.errors['email']) return T.emailInvalide;
  if (c.errors['minlength']) return T.motDePasseCourt;
  if (c.errors['pattern']) return T.telephoneInvalide;
  if (c.errors['differente']) return T.confirmationDifferente;
  if (typeof c.errors['serveur'] === 'string') return c.errors['serveur'];
  return null;
}

/** Message général pour une réponse refusée par l'API. */
export function messageRefus(e: unknown): string {
  if (!(e instanceof HttpErrorResponse) || e.status === 0) return T.erreurServeur;
  if (e.status === HttpStatusCode.TooManyRequests) return T.tropDEssais;
  if (e.status === HttpStatusCode.Unauthorized) return T.identifiantsIncorrects;
  if (e.status >= HttpStatusCode.InternalServerError) return T.erreurServeur;
  return typeof e.error?.message === 'string' ? e.error.message : T.erreurServeur;
}

/** Erreurs de validation renvoyées champ par champ (réponse 422). */
export function erreursParChamp(e: unknown): Record<string, string> {
  if (!(e instanceof HttpErrorResponse) || e.status !== HttpStatusCode.UnprocessableEntity) {
    return {};
  }
  const brutes = (e.error?.errors ?? {}) as Record<string, string[]>;
  return Object.fromEntries(Object.entries(brutes).map(([champ, msgs]) => [champ, msgs[0]]));
}
