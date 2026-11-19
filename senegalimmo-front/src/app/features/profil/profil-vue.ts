/* Logique de présentation du profil, sans Angular. */
import { ProfilCompte, StatutValidation } from '../../core/modeles/profil';
import { Role } from '../../core/session/session';
import { ETATS_PROFIL, TEXTES_PROFIL } from './textes';

export type Couleur = 'text-succes' | 'text-bleu-vif' | 'text-refus' | 'text-encre-3';

export interface Etat {
  libelle: string;
  explication: string;
  couleur: Couleur;
}

const OCTETS_PAR_KO = 1024;
/** Même plafond que ProfilController::TAILLE_MAX_KO. */
export const TAILLE_MAX_OCTETS = 5120 * OCTETS_PAR_KO;
export const TYPES_PHOTO: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
export const TYPES_PIECE: readonly string[] = ['application/pdf', 'image/jpeg', 'image/png'];
const LONGUEUR_DATE = 10;

/** Les rôles qui déposent une pièce d'identité dans cette rubrique. */
export function demandePiece(role: Role): boolean {
  return role === 'client' || role === 'proprietaire';
}

export function etatPiece(compte: ProfilCompte, fournie: boolean): Etat {
  if (compte.role === 'proprietaire' && compte.identite_verifiee) {
    return { ...ETATS_PROFIL.pieceVerifiee, couleur: 'text-succes' };
  }
  if (!fournie) return { ...ETATS_PROFIL.pieceAbsente, couleur: 'text-encre-3' };
  return compte.role === 'proprietaire'
    ? { ...ETATS_PROFIL.pieceAVerifier, couleur: 'text-bleu-vif' }
    : { ...ETATS_PROFIL.pieceFournie, couleur: 'text-succes' };
}

export function etatValidation(statut: StatutValidation | null | undefined): Etat {
  switch (statut) {
    case 'valide':
      return { ...ETATS_PROFIL.valide, couleur: 'text-succes' };
    case 'refuse':
      return { ...ETATS_PROFIL.refuse, couleur: 'text-refus' };
    default:
      return { ...ETATS_PROFIL.enAttente, couleur: 'text-bleu-vif' };
  }
}

/** Contrôle côté navigateur, avant l'envoi, avec la règle du contrôleur. */
export function controlerFichier(
  f: File,
  types: readonly string[],
  messageType: string,
): string | null {
  if (!types.includes(f.type)) return messageType;
  if (f.size > TAILLE_MAX_OCTETS) return TEXTES_PROFIL.tropLourd;
  return null;
}

/** « 1990-04-12T00:00:00.000000Z » devient « 1990-04-12 » pour un champ de type date. */
export function dateSaisie(iso: string | null | undefined): string {
  return iso ? iso.slice(0, LONGUEUR_DATE) : '';
}

export function initiales(prenom: string, nom: string): string {
  return `${prenom.trim().charAt(0)}${nom.trim().charAt(0)}`.toUpperCase();
}

/** La photo est rangée sur un disque privé : seule son adresse signée, complète, peut s'afficher. */
export function photoAffichable(url: string | null): string | null {
  return url && /^https?:\/\//.test(url) ? url : null;
}
