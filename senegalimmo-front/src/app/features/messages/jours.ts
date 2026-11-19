/*
  Libellés de jour partagés par la messagerie et les notifications :
  « Aujourd'hui », « Hier », puis la date en toutes lettres.
*/
import { TEXTES_MESSAGES } from './textes';

const LOCALE = 'fr-FR';
const UN_JOUR = 1;

/** Clé stable d'un jour local, pour regrouper : 2026-11-19. */
export function cleJour(d: Date): string {
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const jour = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mois}-${jour}`;
}

export function libelleJour(d: Date, maintenant: Date): string {
  if (cleJour(d) === cleJour(maintenant)) return TEXTES_MESSAGES.aujourdhui;
  const veille = new Date(
    maintenant.getFullYear(),
    maintenant.getMonth(),
    maintenant.getDate() - UN_JOUR,
  );
  if (cleJour(d) === cleJour(veille)) return TEXTES_MESSAGES.hier;
  return d.toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(d.getFullYear() === maintenant.getFullYear() ? {} : { year: 'numeric' }),
  });
}

/** Heure courte : 14:05. */
export function heure(d: Date): string {
  return d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
}

/** Repère court pour une liste : l'heure aujourd'hui, « Hier », sinon 12 nov. */
export function repereCourt(d: Date, maintenant: Date): string {
  const jour = libelleJour(d, maintenant);
  if (jour === TEXTES_MESSAGES.aujourdhui) return heure(d);
  if (jour === TEXTES_MESSAGES.hier) return jour;
  return d.toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    ...(d.getFullYear() === maintenant.getFullYear() ? {} : { year: 'numeric' }),
  });
}

export interface GroupeJour<T> {
  cle: string;
  libelle: string;
  elements: T[];
}

/** Regroupe par jour local des éléments déjà triés par date (les jours consécutifs se suivent). */
export function grouperParJour<T>(
  elements: readonly T[],
  dateDe: (e: T) => Date,
  maintenant: Date,
): GroupeJour<T>[] {
  const groupes: GroupeJour<T>[] = [];
  for (const e of elements) {
    const d = dateDe(e);
    const cle = cleJour(d);
    const dernier = groupes.at(-1);
    if (dernier?.cle === cle) {
      dernier.elements.push(e);
    } else {
      groupes.push({ cle, libelle: libelleJour(d, maintenant), elements: [e] });
    }
  }
  return groupes;
}
