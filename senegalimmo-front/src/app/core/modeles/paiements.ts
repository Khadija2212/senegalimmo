/* Paiement du diagramme et ses sous-classes (colonne type) : loyer, caution, indemnité. */
import { Personne } from './annonce';

export type TypePaiement = 'loyer' | 'caution' | 'indemnite';
export type MethodePaiement = 'wave' | 'orange_money' | 'free_money' | 'carte_bancaire';
export type StatutPaiement = 'en_attente' | 'reussi' | 'echoue' | 'rembourse';

export interface Recu {
  id: string;
  numero: string;
  emis_le: string | null;
}

/** Réponse de PaiementController::presenter. */
export interface Paiement {
  id: string;
  reference: string;
  type: TypePaiement;
  libelle: string;
  montant: number;
  frais_service: number;
  commission: number;
  montant_net: number;
  methode: MethodePaiement | null;
  statut: StatutPaiement;
  confirme_le: string | null;
  created_at: string;
  bail_id: string | null;
  promesse_id: string | null;
  mois_concerne: string | null;
  recu: Recu | null;
  bien: { id: string; titre: string; quartier: string; ville: string } | null;
  payeur: Personne | null;
  beneficiaire: Personne | null;
}

/** Corps de POST /paiements/initier. */
export interface DemandePaiement {
  type: TypePaiement;
  methode: MethodePaiement;
  bail_id?: string;
  promesse_id?: string;
}

export interface PaiementOuvert {
  redirect_url: string;
  reference: string;
}

export interface Quittance {
  url: string;
  numero: string;
}
