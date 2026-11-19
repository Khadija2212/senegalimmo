/*
  Créneaux de visite proposés au client. Le diagramme ne prévoit pas de disponibilités :
  le client propose, la personne qui gère le bien confirme, refuse ou reprogramme.
*/
const NOMBRE_JOURS = 5;
const DIMANCHE = 0;
const LOCALE = 'fr-FR';

export const HEURES: readonly { valeur: string; libelle: string }[] = [
  { valeur: '09:00', libelle: '9 h 00' },
  { valeur: '10:30', libelle: '10 h 30' },
  { valeur: '12:00', libelle: '12 h 00' },
  { valeur: '15:00', libelle: '15 h 00' },
  { valeur: '16:30', libelle: '16 h 30' },
  { valeur: '18:00', libelle: '18 h 00' },
];

export interface Jour {
  /** AAAA-MM-JJ, en heure locale. */
  valeur: string;
  nomCourt: string;
  date: string;
}

/** Les prochains jours ouvrés, à partir de demain, sans le dimanche. */
export function prochainsJours(depuis: Date = new Date()): Jour[] {
  const jours: Jour[] = [];
  const d = new Date(depuis.getFullYear(), depuis.getMonth(), depuis.getDate() + 1);
  while (jours.length < NOMBRE_JOURS) {
    if (d.getDay() !== DIMANCHE) jours.push(versJour(d));
    d.setDate(d.getDate() + 1);
  }
  return jours;
}

/** Date et heure au format attendu par l'API. */
export function dateHeure(jour: string, heure: string): string {
  return `${jour}T${heure}:00`;
}

function versJour(d: Date): Jour {
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const jour = String(d.getDate()).padStart(2, '0');
  return {
    valeur: `${d.getFullYear()}-${mois}-${jour}`,
    nomCourt: d.toLocaleDateString(LOCALE, { weekday: 'short' }),
    date: d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' }),
  };
}
