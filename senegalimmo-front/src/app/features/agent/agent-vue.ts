/* Briques communes de l'espace agent : état en mot coloré, dates, noms, photo, bandeau. */
import { Media, Personne } from '../../core/modeles/annonce';
import { TEXTES_AGENT } from './textes';

const T = TEXTES_AGENT;
const LOCALE = 'fr-FR';
const POURCENT = 100;
const MS_PAR_JOUR = 86_400_000;
const LONGUEUR_JOUR = 10;

export type Ton = 'ok' | 'attente' | 'non' | 'neutre';

export interface Etat {
  libelle: string;
  ton: Ton;
  explication: string | null;
}

/** Couleur du mot d'état : jamais de pastille, seulement la couleur du texte. */
export const COULEURS: Readonly<Record<Ton, string>> = {
  ok: 'text-succes',
  attente: 'text-bleu-vif',
  non: 'text-refus',
  neutre: 'text-encre-3',
};

/** Mise en page d'une ligne de registre : photo, contenu, actions ; une colonne de moins sur téléphone. */
export const CLASSE_LIGNE =
  'grid grid-cols-[64px_minmax(0,1fr)] items-start gap-3.5 border-b border-border py-[18px] sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:gap-[18px]';

export function nomDe(p: Personne | null | undefined): string {
  return p ? `${p.prenom} ${p.nom}` : '';
}

/** Première photo du bien, dans l'ordre choisi par le propriétaire. */
export function photoDe(medias: readonly Media[] | undefined): string | null {
  return (
    [...(medias ?? [])].filter((m) => m.type === 'photo').sort((a, b) => a.ordre - b.ordre)[0]
      ?.lien ?? null
  );
}

/** 0.42 devient « 42 % ». */
export function pourcent(taux: number): string {
  return `${Math.round(taux * POURCENT)} %`;
}

export function dateLongue(d: Date): string {
  const jour = d.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} à ${d.getHours()} h ${m}`;
}

export function dateCourte(d: Date): string {
  return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
}

export function dateComplete(d: Date): string {
  return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Une date « AAAA-MM-JJ... » de l'API, prise comme un jour du calendrier local. */
export function jourLocal(iso: string): Date {
  const [a, m, j] = iso.slice(0, LONGUEUR_JOUR).split('-').map(Number);
  return new Date(a, m - 1, j);
}

/** Nombre de jours du calendrier de « depuis » à « jusque » : 0 le jour même, négatif si passé. */
export function joursEntre(depuis: Date, jusque: Date): number {
  const debut = new Date(depuis.getFullYear(), depuis.getMonth(), depuis.getDate());
  const fin = new Date(jusque.getFullYear(), jusque.getMonth(), jusque.getDate());
  return Math.round((fin.getTime() - debut.getTime()) / MS_PAR_JOUR);
}

/** Phrase du bandeau : ce qui attend l'agent, par ordre d'urgence. */
export function resumerAgent(
  visitesAConfirmer: number,
  comptesRendus: number,
  demandes: number,
): string {
  const morceaux: string[] = [];
  if (visitesAConfirmer) morceaux.push(T.visitesAConfirmer(visitesAConfirmer));
  if (comptesRendus) morceaux.push(T.comptesRendus(comptesRendus));
  if (demandes) morceaux.push(T.demandesAttente(demandes));
  if (!morceaux.length) return T.rienEnAttente;
  const phrase =
    morceaux.length > 1
      ? `${morceaux.slice(0, -1).join(', ')} et ${morceaux[morceaux.length - 1]}`
      : morceaux[0];
  return `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)}.`;
}

/** Valeur d'un champ datetime-local (AAAA-MM-JJTHH:MM) en heure locale. */
export function valeurDateHeure(d: Date): string {
  const deux = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}T${deux(d.getHours())}:${deux(d.getMinutes())}`;
}
