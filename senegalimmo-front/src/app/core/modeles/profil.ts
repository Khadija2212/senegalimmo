/* Types du cas « Gérer son profil », alignés sur Compte, Client, Proprietaire et Agent. */
import { Role } from '../session/session';

export type StatutValidation = 'en_attente' | 'valide' | 'refuse';

/** Réponse de GET /moi et POST /profil : la pièce d'identité y est masquée. */
export interface ProfilCompte {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  photo_url: string | null;
  /** Adresse de lecture temporaire de la photo, signée par le backend. */
  photo_lien: string | null;
  role: Role;
  date_naissance?: string | null;
  profession?: string | null;
  adresse?: string | null;
  identite_verifiee?: boolean | null;
  numero_carte_professionnelle?: string | null;
  agence?: string | null;
  statut_validation?: StatutValidation | null;
}

/** Champs envoyés à POST /profil ; seuls ceux du rôle sont acceptés par le backend. */
export interface ModificationProfil {
  prenom: string;
  nom: string;
  telephone?: string;
  date_naissance?: string;
  profession?: string;
  adresse?: string;
  agence?: string;
  numero_carte_professionnelle?: string;
  photo?: File;
}

export interface ChangementMotDePasse {
  ancien: string;
  nouveau: string;
  nouveau_confirmation: string;
}

export interface LienPiece {
  url: string;
}
