/* État affiché en mot coloré, commun aux contrats et aux paiements. */

export type Ton = 'ok' | 'attente' | 'non' | 'neutre';

export interface Etat {
  libelle: string;
  ton: Ton;
  explication: string | null;
}

export const COULEUR_TON: Readonly<Record<Ton, string>> = {
  ok: 'text-succes',
  attente: 'text-bleu-vif',
  non: 'text-refus',
  neutre: 'text-encre-3',
};

const LOCALE = 'fr-FR';
/** Une date sans heure (« 2026-12-05 » ou minuit UTC) se lit en UTC, sinon elle glisse d'un jour. */
const SANS_HEURE = /^\d{4}-\d{2}-\d{2}(T00:00:00(\.0+)?Z)?$/;

/** « 5 décembre 2026 ». */
export function jour(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: SANS_HEURE.test(iso) ? 'UTC' : undefined,
  });
}

/** « 5 déc. », pour les lignes de registre. */
export function jourCourt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: SANS_HEURE.test(iso) ? 'UTC' : undefined,
  });
}

/** « décembre 2026 », pour un mois de loyer. */
export function mois(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
