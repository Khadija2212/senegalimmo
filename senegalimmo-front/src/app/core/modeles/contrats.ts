/* Contrats du diagramme : Bail, PromesseVente et Mandat partagent la table « contrats » (colonne nature). */
import { Media, Personne } from './annonce';

export type NatureContrat = 'bail' | 'promesse_vente' | 'mandat';
export type StatutContrat = 'brouillon' | 'en_signature' | 'signe' | 'resilie' | 'expire';
export type StatutSignature = 'en_attente' | 'signee' | 'refusee' | 'expiree';
export type RoleSignataire = 'client' | 'proprietaire' | 'agent' | 'administrateur';
export type TypeMandat = 'simple' | 'exclusif';
export type TypeEtatDesLieux = 'entree' | 'sortie';

export interface Signataire extends Personne {
  role: RoleSignataire;
}

export interface Signature {
  id: string;
  signataire_id: string;
  statut: StatutSignature;
  signe_le: string | null;
  signataire: Signataire | null;
}

export interface BienContrat {
  id: string;
  titre: string;
  adresse: string;
  quartier: string;
  ville: string;
}

/** Réponse de ContratController::presenter : colonnes communes, puis celles de la nature. */
interface ContratCommun {
  id: string;
  reference: string;
  statut: StatutContrat;
  signe_le: string | null;
  date_debut: string | null;
  created_at: string;
  bien: BienContrat;
  signatures: Signature[];
  signe_par_tous: boolean;
}

export interface Bail extends ContratCommun {
  nature: 'bail';
  demande_location_id: string;
  loyer_mensuel: number;
  charges: number;
  caution: number;
  duree_mois: number;
  jour_echeance: number;
}

export interface PromesseVente extends ContratCommun {
  nature: 'promesse_vente';
  offre_achat_id: string;
  prix_vente: number;
  indemnite_immobilisation: number;
  date_limite_acte: string;
  conditions_suspensives: string | null;
}

export interface Mandat extends ContratCommun {
  nature: 'mandat';
  agent_id: string;
  type: TypeMandat;
  taux_commission: number;
  date_fin: string;
}

export type Contrat = Bail | PromesseVente | Mandat;

/** Réponse de GET /baux/{id}/echeancier. */
export interface Echeancier {
  loyer_mensuel: number;
  charges: number;
  caution: number;
  caution_payee: boolean;
  loyers_payes: number;
  loyers_total: number;
  prochaine_echeance: string | null;
  date_fin: string;
}

export interface EtatDesLieux {
  id: string;
  type: TypeEtatDesLieux;
  date: string;
  observations: string | null;
  releve_compteurs: string | null;
  valide_le: string | null;
  photos: Media[];
}

/** Corps de POST /baux/{id}/etats-des-lieux : les photos sont des médias déjà rangés sur le bien. */
export interface NouvelEtatDesLieux {
  type: TypeEtatDesLieux;
  observations: string | null;
  releve_compteurs: string | null;
  photos: string[];
}

/** Demande de location vue par le propriétaire (GET /demandes-location). */
export interface DemandePourBail {
  id: string;
  statut: 'en_attente' | 'acceptee' | 'refusee' | 'annulee';
  date_entree_souhaitee: string;
  duree_mois: number;
  annonce: {
    id: string;
    prix: number;
    charges: number;
    caution: number;
    bien: { id: string; titre: string; quartier: string; ville: string };
  };
  client: Personne | null;
  bail: { id: string } | null;
}

/** Adresse de lecture signée d'un document PDF. */
export interface AdresseDocument {
  url: string;
}
