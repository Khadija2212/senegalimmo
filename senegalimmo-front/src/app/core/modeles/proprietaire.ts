/* Espace du propriétaire : réponses de l'API pour ses biens, annonces, demandes reçues et mandats. */
import { Annonce, Bien, Media, StatutBien, TypeBien, TypeTransaction } from './annonce';
import { DemandeLocation, OffreAchat, Visite } from './demarches';

/** Réponse de GET /api/tableau-de-bord pour un propriétaire (Proprietaire.indicateursTableauDeBord). */
export interface IndicateursProprietaire {
  biens: number;
  annonces_publiees: number;
  annonces_en_moderation: number;
  demandes_en_attente: number;
  visites_a_confirmer: number;
  offres_en_attente: number;
  messages_non_lus: number;
  solde: number;
}

export interface ClientDemandeur {
  id: string;
  prenom: string;
  nom: string;
  telephone: string | null;
  profession?: string | null;
}

export interface DemandeRecue extends DemandeLocation {
  message: string | null;
  client: ClientDemandeur;
}

export interface OffreRecue extends OffreAchat {
  message: string | null;
  client: ClientDemandeur;
}

export interface VisiteRecue extends Visite {
  client: ClientDemandeur;
}

export type StatutAnnonce =
  'en_moderation' | 'publiee' | 'suspendue' | 'rejetee' | 'louee' | 'vendue' | 'expiree';

export interface OptionPremium {
  id: string;
  libelle: string;
  duree_jours: number;
  prix: number;
}

/** Annonce de GET /api/mes-annonces : avec son statut, son bien et ses photos. */
export interface AnnonceGeree extends Omit<Annonce, 'bien'> {
  bien_id: string;
  statut: StatutAnnonce;
  premium_jusquau: string | null;
  created_at: string;
  option_premium: OptionPremium | null;
  bien: Bien;
}

export type StatutContrat = 'brouillon' | 'en_signature' | 'signe' | 'resilie' | 'expire';
export type TypeMandat = 'simple' | 'exclusif';

export interface Mandat {
  id: string;
  reference: string | null;
  statut: StatutContrat;
  type: TypeMandat;
  taux_commission: number;
  date_debut: string;
  date_fin: string;
  agent: { id: string; prenom: string; nom: string } | null;
}

/** Bien de GET /api/biens ; GET /api/biens/{id} y ajoute les mandats. */
export interface BienGere extends Omit<Bien, 'medias' | 'proprietaire'> {
  statut: StatutBien;
  created_at: string;
  medias: Media[];
  mandats?: Mandat[];
}

/** Agent validé, de GET /api/agents. */
export interface AgentValide {
  id: string;
  prenom: string;
  nom: string;
  agence: string | null;
  photo_url: string | null;
  valide_le: string | null;
}

export interface NouveauBien {
  titre: string;
  description: string;
  type: TypeBien;
  surface: number;
  nombre_pieces: number;
  nombre_chambres: number;
  meuble: boolean;
  adresse: string;
  quartier: string;
  ville: string;
}

export interface NouvelleAnnonce {
  bien_id: string;
  type_transaction: TypeTransaction;
  prix: number;
  charges: number;
  caution: number;
}

export interface NouveauMandat {
  agent_id: string;
  bien_id: string;
  type: TypeMandat;
  taux_commission: number;
  date_debut: string;
  date_fin: string;
}
