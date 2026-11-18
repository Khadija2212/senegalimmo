/* Démarches du client, alignées sur Visite, DemandeLocation et OffreAchat du diagramme. */
import { Agent, Annonce } from './annonce';

export type StatutVisite = 'demandee' | 'confirmee' | 'refusee' | 'annulee' | 'effectuee';
export type StatutDemande = 'en_attente' | 'acceptee' | 'refusee' | 'annulee';
export type StatutOffre = 'en_attente' | 'acceptee' | 'refusee' | 'retiree' | 'expiree';

export interface Visite {
  id: string;
  date_heure: string;
  statut: StatutVisite;
  motif_refus: string | null;
  annonce: Annonce;
  agent: Agent | null;
}

export interface DemandeLocation {
  id: string;
  date_entree_souhaitee: string;
  duree_mois: number;
  statut: StatutDemande;
  motif_refus: string | null;
  created_at: string;
  updated_at: string;
  annonce: Annonce;
  bail: { id: string } | null;
}

export interface OffreAchat {
  id: string;
  montant: number;
  statut: StatutOffre;
  motif_refus: string | null;
  expire_le: string | null;
  created_at: string;
  updated_at: string;
  annonce: Annonce;
  promesse_vente: { id: string } | null;
}

/** Réponse de GET /api/tableau-de-bord pour un client (Client.indicateursTableauDeBord). */
export interface IndicateursClient {
  favoris: number;
  demandes_location: number;
  visites: number;
  offres_en_cours: number;
  baux_signes: number;
  promesses_signees: number;
  messages_non_lus: number;
}
