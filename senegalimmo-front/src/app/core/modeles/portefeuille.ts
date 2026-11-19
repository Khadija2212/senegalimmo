/* Portefeuille du propriétaire ou de l'agent, aligné sur Portefeuille, Ecriture et Retrait. */

export type TypeEcriture =
  | 'credit_loyer'
  | 'credit_vente'
  | 'commission_agent'
  | 'blocage_retrait'
  | 'debit_retrait'
  | 'deblocage';

export interface Ecriture {
  id: string;
  type: TypeEcriture;
  montant: number;
  solde_apres: number;
  libelle: string;
  date: string;
}

export type StatutRetrait = 'demande' | 'approuve' | 'verse' | 'rejete';
export type MethodeRetrait = 'wave' | 'orange_money' | 'free_money';

export interface Retrait {
  id: string;
  montant: number;
  methode: MethodeRetrait;
  numero_beneficiaire: string;
  statut: StatutRetrait;
  motif_rejet: string | null;
  demande_le: string | null;
  traite_le: string | null;
}

/** Réponse de GET /api/portefeuille (PortefeuilleController.show). */
export interface EtatPortefeuille {
  solde_disponible: number;
  solde_en_attente: number;
  mis_a_jour_le: string | null;
  /** Montant minimal d'un retrait, en FCFA. */
  minimum: number;
  ecritures: Ecriture[];
  retraits: Retrait[];
}

export interface DemandeRetrait {
  montant: number;
  methode: MethodeRetrait;
  numero_beneficiaire: string;
}
