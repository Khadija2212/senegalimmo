/* Dates de l'administration, en français. */

const LOCALE = 'fr-FR';
const FORMAT_DATE = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const LONGUEUR_JOUR_ISO = 10;

/** « 19 nov. 2026 », ou une chaîne vide pour une date absente. */
export function dateCourte(iso: string | null | undefined): string {
  return iso ? FORMAT_DATE.format(new Date(iso)) : '';
}

/** Date du jour au format des champs date : « 2026-11-19 ». */
export function aujourdhuiIso(maintenant: Date = new Date()): string {
  const local = new Date(maintenant.getTime() - maintenant.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, LONGUEUR_JOUR_ISO);
}
