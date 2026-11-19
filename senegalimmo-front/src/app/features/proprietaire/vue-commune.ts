/* Petits outils de présentation communs aux rubriques de l'espace propriétaire. */
import { Media } from '../../core/modeles/annonce';

export type Ton = 'ok' | 'attente' | 'non' | 'neutre';

export interface Etat {
  libelle: string;
  ton: Ton;
  explication: string | null;
}

const LOCALE = 'fr-FR';

/** Classe de couleur du mot d'état. */
export const COULEURS_TON: Readonly<Record<Ton, string>> = {
  ok: 'text-succes',
  attente: 'text-bleu-vif',
  non: 'text-refus',
  neutre: 'text-encre-3',
};

export function photoPrincipale(medias: readonly Media[] | undefined): string | null {
  return (
    [...(medias ?? [])].filter((m) => m.type === 'photo').sort((x, y) => x.ordre - y.ordre)[0]
      ?.lien ?? null
  );
}

export function dateCourte(d: Date): string {
  return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
}

export function dateJour(d: Date): string {
  return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** « Samedi 22 novembre à 10 h 00 ». */
export function dateLongue(d: Date): string {
  const jour = d.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} à ${d.getHours()} h ${m}`;
}

export function nomComplet(p: { prenom: string; nom: string } | null | undefined): string {
  return p ? `${p.prenom} ${p.nom}` : '';
}

/** Date au format des champs `type="date"` : AAAA-MM-JJ, en heure locale. */
export function versIso(d: Date): string {
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mois}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dansMois(d: Date, mois: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + mois, d.getDate());
}
