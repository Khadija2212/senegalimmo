const FORMAT_NOMBRE = new Intl.NumberFormat('fr-FR');
const FORMAT_COMPACT = new Intl.NumberFormat('fr-FR', {
  notation: 'compact',
  maximumFractionDigits: 1,
});
const ESPACE_FINE = / /g;
const ESPACE_INSECABLE = ' ';

/** 350000 devient « 350 000 », avec des espaces insécables. */
export function nombre(n: number): string {
  return FORMAT_NOMBRE.format(n).replace(ESPACE_FINE, ESPACE_INSECABLE);
}

/** 350000 devient « 350 000 FCFA ». */
export function fcfa(n: number): string {
  return `${nombre(n)}${ESPACE_INSECABLE}FCFA`;
}

/** 350000 devient « 350 k », pour les étiquettes de la carte. */
export function fcfaCourt(n: number): string {
  return FORMAT_COMPACT.format(n).replace(ESPACE_FINE, ESPACE_INSECABLE);
}

/** Garde les chiffres d'une saisie : « 400 000 » devient 400000. */
export function lireMontant(saisie: string): number {
  return Number.parseInt(saisie.replace(/\D/g, ''), 10) || 0;
}
