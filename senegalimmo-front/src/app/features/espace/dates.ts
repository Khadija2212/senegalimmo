/* Dates affichées dans l'espace client, en français. */
const LOCALE = 'fr-FR';
const MS_PAR_JOUR = 86_400_000;

export function jourRelatif(date: number, maintenant: Date): string {
  const d = new Date(date);
  const ecart = Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate()).getTime()) /
      MS_PAR_JOUR,
  );
  if (ecart === 0) return "aujourd'hui";
  if (ecart === 1) return 'demain';
  return d.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
}

export function dateLongue(d: Date): string {
  const jour = d.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' });
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} à ${h} h ${m}`;
}

export function dateLongueSansHeure(d: Date): string {
  return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long' });
}

export function dateCourte(d: Date): string {
  return d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
}
