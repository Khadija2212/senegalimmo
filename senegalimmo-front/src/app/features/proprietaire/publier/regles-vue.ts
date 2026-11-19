/*
  Règles de saisie du bien, de l'annonce et des photos, alignées sur BienController,
  AnnonceController et MediaController. Sans Angular : testées seules.
*/
import { TEXTES_PUBLIER } from './textes';

const T = TEXTES_PUBLIER;

export const LONGUEURS = {
  titre: 150,
  description: 5000,
  adresse: 255,
  quartier: 100,
  ville: 100,
} as const;

/** MediaController : 20 480 Ko au plus, jpg, jpeg, png ou webp. */
export const PHOTO_TAILLE_MAX_OCTETS = 20_480 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const PHOTO_ACCEPT = '.jpg,.jpeg,.png,.webp';

export function photoAcceptable(f: { type: string; size: number }): boolean {
  return (PHOTO_TYPES as readonly string[]).includes(f.type) && f.size <= PHOTO_TAILLE_MAX_OCTETS;
}

/** Codes d'erreur produits par les validateurs du formulaire. */
export type CodeErreur =
  'required' | 'maxlength' | 'positif' | 'entier' | 'pasNegatif' | 'auMoinsUne' | 'serveur';

/** Message à afficher sous un champ, à partir de ses erreurs de validation. */
export function messageRegle(erreurs: Readonly<Record<string, unknown>> | null): string | null {
  if (!erreurs) return null;
  if (erreurs['required']) return T.requis;
  const long = erreurs['maxlength'] as { requiredLength: number } | undefined;
  if (long) return T.tropLong(long.requiredLength);
  if (erreurs['entier']) return T.entier;
  if (erreurs['positif']) return T.positif;
  if (erreurs['auMoinsUne']) return T.auMoinsUne;
  if (erreurs['pasNegatif']) return T.pasNegatif;
  if (erreurs['min']) return T.pasNegatif;
  return typeof erreurs['serveur'] === 'string' ? erreurs['serveur'] : null;
}

/** Vérification d'un nombre saisi : null si conforme, sinon le code d'erreur. */
export function verifierNombre(
  valeur: unknown,
  regle: { entier?: boolean; min: number; strict?: boolean },
): CodeErreur | null {
  if (valeur === null || valeur === undefined || valeur === '') return null;
  const n = Number(valeur);
  if (Number.isNaN(n)) return regle.entier ? 'entier' : 'positif';
  if (regle.entier && !Number.isInteger(n)) return 'entier';
  if (regle.strict ? n <= regle.min : n < regle.min) {
    return regle.strict ? 'positif' : regle.min > 0 ? 'auMoinsUne' : 'pasNegatif';
  }
  return null;
}
