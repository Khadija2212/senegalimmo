/* Espace agent, aligné sur Agent, Mandat, CompteRendu et NiveauInteret du diagramme. */
import { Annonce, Bien, Personne, TypeTransaction } from './annonce';
import { DemandeLocation, OffreAchat, Visite } from './demarches';

export type StatutValidation = 'en_attente' | 'valide' | 'refuse';
export type NiveauInteret = 'faible' | 'moyen' | 'fort';
export type TypeMandat = 'simple' | 'exclusif';
export type StatutContrat = 'brouillon' | 'en_signature' | 'signe' | 'resilie' | 'expire';
export type StatutAnnonce =
  'en_moderation' | 'publiee' | 'suspendue' | 'rejetee' | 'louee' | 'vendue' | 'expiree';

/** Réponse de GET /api/moi pour un agent : le compte et sa validation par l'administrateur. */
export interface CompteAgent extends Personne {
  agence: string | null;
  statut_validation: StatutValidation;
}

/** Réponse de GET /api/tableau-de-bord pour un agent (Agent.indicateursTableauDeBord). */
export interface IndicateursAgent {
  biens_assignes: number;
  mandats_en_signature: number;
  visites_a_confirmer: number;
  visites_confirmees: number;
  /** Entre 0 et 1. */
  taux_conversion: number;
  messages_non_lus: number;
  solde: number;
}

/** Réponse de GET /api/agent/performances : les mêmes indicateurs. */
export type PerformancesAgent = IndicateursAgent;

export interface Client extends Personne {
  telephone: string | null;
  profession?: string | null;
}

export interface CompteRendu {
  id: string;
  contenu: string;
  interet_client: NiveauInteret;
  redige_le: string;
}

/** Visite sur un bien géré : le client et le compte rendu sont joints. */
export interface VisiteGeree extends Visite {
  client: Client;
  compte_rendu: CompteRendu | null;
}

export interface DemandeGeree extends DemandeLocation {
  client: Client;
}

export interface OffreGeree extends OffreAchat {
  client: Client;
}

export interface AnnonceDuBien {
  id: string;
  statut: StatutAnnonce;
  type_transaction: TypeTransaction;
  prix: number;
}

/** Réponse de GET /api/biens pour un agent : biens sous mandat actif. */
export interface BienAssigne extends Omit<Bien, 'proprietaire'> {
  annonces: AnnonceDuBien[];
}

export interface Signataire extends Personne {
  role: string;
}

/** Mandat tel que GET /api/contrats le présente (ContratController::presenter). */
export interface Mandat {
  id: string;
  reference: string;
  nature: 'mandat';
  statut: StatutContrat;
  type: TypeMandat;
  taux_commission: number;
  date_debut: string;
  date_fin: string;
  bien: Pick<Bien, 'id' | 'titre' | 'adresse' | 'quartier' | 'ville'>;
  signatures: { id: string; statut: string; signataire: Signataire | null }[];
}

/** Corps de POST /api/mes-annonces (AnnonceController::store). */
export interface NouvelleAnnonce {
  bien_id: string;
  type_transaction: TypeTransaction;
  prix: number;
  charges: number;
  caution: number;
}

export type AnnoncePubliee = Omit<Annonce, 'bien'>;
