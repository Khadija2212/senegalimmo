/** Saisie d'une démarche gardée pendant la connexion, pour la retrouver au retour sur l'annonce. */
export type OngletDemarche = 'visite' | 'demande';

export interface Brouillon {
  onglet: OngletDemarche;
  valeurs: Record<string, string | number>;
}

const PREFIXE = 'si-brouillon-';

export function garderBrouillon(annonceId: string, brouillon: Brouillon): void {
  try {
    sessionStorage.setItem(PREFIXE + annonceId, JSON.stringify(brouillon));
  } catch {
    return;
  }
}

/** Lu une seule fois : le brouillon disparaît dès qu'il est repris. */
export function reprendreBrouillon(annonceId: string): Brouillon | null {
  try {
    const brut = sessionStorage.getItem(PREFIXE + annonceId);
    sessionStorage.removeItem(PREFIXE + annonceId);
    return brut ? (JSON.parse(brut) as Brouillon) : null;
  } catch {
    return null;
  }
}
