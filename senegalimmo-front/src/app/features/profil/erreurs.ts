import { AbstractControl } from '@angular/forms';
import { TEXTES_PROFIL } from './textes';

const T = TEXTES_PROFIL;

/** Message sous un champ du profil, après une sortie du champ ou une tentative d'envoi. */
export function messageChamp(c: AbstractControl): string | null {
  if (!c.touched || !c.errors) return null;
  const e = c.errors;
  if (e['required']) return T.requis;
  if (e['pattern']) return T.telephoneInvalide;
  if (e['minlength']) return T.motDePasseCourt;
  if (e['maxlength']) return T.trop(e['maxlength'].requiredLength);
  if (e['differente']) return T.confirmationDifferente;
  if (e['future']) return T.dateFuture;
  if (typeof e['serveur'] === 'string') return e['serveur'];
  return null;
}
