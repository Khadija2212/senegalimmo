/* Types des réponses de l'API d'administration, alignés sur les contrôleurs Admin du backend. */

import { Annonce, Personne, TypeTransaction } from './annonce';
import { MotifSignalement } from '../services/demarches';
import { Role } from '../session/session';

/** RoleAdmin : borne les domaines qu'un administrateur traite. */
export type NiveauAdmin = 'moderateur' | 'finance' | 'super_admin';

/** Réponse de GET /moi pour un administrateur. */
export interface AdministrateurConnecte extends Personne {
  email: string;
  role: 'administrateur';
  niveau: NiveauAdmin;
}

/** Administrateur::indicateursAdministration. */
export interface IndicateursAdmin {
  utilisateurs: number;
  annonces_a_moderer: number;
  agents_a_valider: number;
  signalements_ouverts: number;
  retraits_en_attente: number;
  volume: number;
  commissions: number;
}

/** Page Laravel (paginate). */
export interface Page<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

export type StatutAnnonce =
  'en_moderation' | 'publiee' | 'suspendue' | 'rejetee' | 'louee' | 'vendue' | 'expiree';

export type DecisionModeration = 'approuver' | 'rejeter' | 'suspendre';

export interface AnnonceModeration extends Annonce {
  statut: StatutAnnonce;
  updated_at: string;
}

export type StatutCompte = 'actif' | 'suspendu' | 'supprime';
export type StatutValidation = 'en_attente' | 'valide' | 'refuse';

export interface CompteAdmin extends Personne {
  email: string;
  telephone: string | null;
  role: Role;
  statut: StatutCompte;
  created_at: string;
  identite_verifiee?: boolean;
  statut_validation?: StatutValidation | null;
  agence?: string | null;
  numero_carte_professionnelle?: string | null;
}

export interface FiltresComptes {
  role?: Role;
  q?: string;
  page: number;
}

export interface LienPiece {
  url: string;
}

export type StatutSignalement = 'ouvert' | 'en_cours' | 'resolu' | 'rejete';

export interface SignalementAdmin {
  id: string;
  motif: MotifSignalement;
  description: string;
  statut: StatutSignalement;
  resolution: string | null;
  traite_le: string | null;
  created_at: string;
  client: Personne | null;
  annonce: { id: string; bien: { id: string; titre: string } | null } | null;
}

export type StatutRetrait = 'demande' | 'approuve' | 'verse' | 'rejete';
export type MethodeRetrait = 'wave' | 'orange_money' | 'free_money' | 'carte_bancaire';

export interface RetraitAdmin {
  id: string;
  montant: number;
  methode: MethodeRetrait;
  numero_beneficiaire: string;
  statut: StatutRetrait;
  motif_rejet: string | null;
  reference_paytech: string | null;
  demande_le: string;
  traite_le: string | null;
  portefeuille: { user: (Personne & { telephone: string | null }) | null } | null;
  validateur: Personne | null;
}

export type DecisionRetrait = 'approuver' | 'rejeter';

export type StatutPaiement = 'en_attente' | 'reussi' | 'echoue' | 'rembourse';
export type TypePaiement = 'loyer' | 'caution' | 'indemnite';

export interface PaiementAdmin {
  id: string;
  type: TypePaiement;
  libelle: string;
  reference: string;
  montant: number;
  frais_service: number;
  commission: number;
  methode: MethodeRetrait;
  statut: StatutPaiement;
  confirme_le: string | null;
  created_at: string;
}

export interface FiltresTransactions {
  statut?: StatutPaiement;
  du?: string;
  au?: string;
  page: number;
}

export interface Transactions {
  total: number;
  commissions: number;
  paiements: Page<PaiementAdmin>;
}

export interface RegleCommission {
  id: string;
  type_transaction: TypeTransaction;
  taux: number;
  montant_minimum: number;
  actif_depuis: string;
  administrateur: Personne | null;
}

export interface NouvelleRegle {
  type_transaction: TypeTransaction;
  taux: number;
  montant_minimum: number;
  actif_depuis: string;
}

export interface OptionPremium {
  id: string;
  libelle: string;
  duree_jours: number;
  prix: number;
  active: boolean;
}

export type SaisieOption = Omit<OptionPremium, 'id'>;

export type CanalNotification = 'push' | 'sms' | 'email';

/** Un compte précis (compte_id) ou tous les comptes actifs d'un rôle. */
export interface NotificationAdmin {
  compte_id?: string;
  role?: Role;
  canal: CanalNotification;
  titre: string;
  contenu: string;
}

export interface EnvoiNotification {
  envoyees: number;
}
