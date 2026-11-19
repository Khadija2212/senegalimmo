/*
  Paiements : libellés, état en mot coloré, sommes dues calculées depuis les contrats signés,
  et lecture de l'état au retour de la passerelle.
*/
import { Bail, Contrat, Echeancier, PromesseVente } from '../../core/modeles/contrats';
import {
  DemandePaiement,
  MethodePaiement,
  Paiement,
  TypePaiement,
} from '../../core/modeles/paiements';
import { DonneesAPayer } from '../../core/services/paiements';
import { Etat, jourCourt, mois } from '../contrats/etat';
import { TEXTES_PAIEMENTS } from './textes';

const T = TEXTES_PAIEMENTS;
const CHEMIN_CONTRATS = '/contrats/';

/** Méthodes acceptées par InitierPaiementRequest (MethodePaiement côté backend). */
export const METHODES: readonly MethodePaiement[] = [
  'wave',
  'orange_money',
  'free_money',
  'carte_bancaire',
];

export interface SommeDue {
  cle: string;
  type: TypePaiement;
  contratId: string;
  libelle: string;
  bien: string;
  montant: number;
  /** Date limite du loyer, null pour une caution ou une indemnité. */
  echeance: string | null;
}

/** Paramètres d'adresse reçus depuis un contrat (« Payer la caution », « Payer le loyer »). */
export interface Preselection {
  type?: string;
  bail?: string;
  promesse?: string;
}

export type PhaseRetour = 'reussi' | 'en_cours' | 'attente_longue' | 'echoue' | 'rembourse';

export function libelleMethode(m: MethodePaiement | null): string {
  return m ? T.methodes[m] : '';
}

export function etatPaiement(p: Paiement): Etat {
  const quand = jourCourt(p.confirme_le ?? p.created_at);
  switch (p.statut) {
    case 'reussi':
      return { libelle: T.reussi, ton: 'ok', explication: T.le(quand) };
    case 'en_attente':
      return { libelle: T.enAttente, ton: 'attente', explication: T.le(quand) };
    case 'echoue':
      return { libelle: T.echoue, ton: 'non', explication: T.le(quand) };
    case 'rembourse':
      return { libelle: T.rembourse, ton: 'neutre', explication: T.le(quand) };
  }
}

/** Un loyer donne une quittance ; une caution ou une indemnité, un reçu. */
export function libelleDocument(p: Paiement): string {
  return p.type === 'loyer' ? T.telechargerQuittance : T.telechargerRecu;
}

export function peutTelecharger(p: Paiement): boolean {
  return p.statut === 'reussi' && p.recu !== null;
}

export function lienContrat(p: Paiement): string | null {
  const id = p.bail_id ?? p.promesse_id;
  return id ? CHEMIN_CONTRATS + id : null;
}

/** Sommes dues : caution et prochain loyer de chaque bail, indemnité de chaque promesse. */
export function sommesDues(d: DonneesAPayer, paiements: readonly Paiement[]): SommeDue[] {
  return d.contrats.flatMap((c) => dusPour(c, d.echeanciers[c.id], paiements));
}

function dusPour(
  c: Contrat,
  e: Echeancier | undefined,
  paiements: readonly Paiement[],
): SommeDue[] {
  if (c.statut !== 'signe') return [];
  if (c.nature === 'promesse_vente') return dusPromesse(c, paiements);
  return c.nature === 'bail' && e ? dusBail(c, e) : [];
}

function dusPromesse(c: PromesseVente, paiements: readonly Paiement[]): SommeDue[] {
  const payee = paiements.some(
    (p) => p.type === 'indemnite' && p.promesse_id === c.id && p.statut === 'reussi',
  );
  if (payee || c.indemnite_immobilisation <= 0) return [];
  return [
    {
      cle: `indemnite-${c.id}`,
      type: 'indemnite',
      contratId: c.id,
      bien: c.bien.titre,
      libelle: T.indemnite,
      montant: c.indemnite_immobilisation,
      echeance: null,
    },
  ];
}

function dusBail(c: Bail, e: Echeancier): SommeDue[] {
  const base = { contratId: c.id, bien: c.bien.titre };
  const dus: SommeDue[] = [];
  if (e.caution > 0 && !e.caution_payee) {
    dus.push({
      ...base,
      cle: `caution-${c.id}`,
      type: 'caution',
      libelle: T.caution,
      montant: e.caution,
      echeance: null,
    });
  }
  if (e.prochaine_echeance) {
    dus.push({
      ...base,
      cle: `loyer-${c.id}`,
      type: 'loyer',
      libelle: T.loyerDe(mois(e.prochaine_echeance)),
      montant: e.loyer_mensuel + e.charges,
      echeance: e.prochaine_echeance,
    });
  }
  return dus;
}

/** La somme désignée par l'adresse, sinon la première due. */
export function preselectionner(dus: readonly SommeDue[], p: Preselection): string | null {
  const contrat = p.type === 'indemnite' ? p.promesse : p.bail;
  const trouvee = dus.find((s) => s.type === p.type && s.contratId === contrat);
  return trouvee?.cle ?? dus[0]?.cle ?? null;
}

export function demandePour(s: SommeDue, methode: MethodePaiement): DemandePaiement {
  return s.type === 'indemnite'
    ? { type: s.type, methode, promesse_id: s.contratId }
    : { type: s.type, methode, bail_id: s.contratId };
}

/** Où en est le paiement au retour : `derniere` vaut vrai à la dernière relecture permise. */
export function phaseRetour(p: Paiement, derniere: boolean): PhaseRetour {
  switch (p.statut) {
    case 'reussi':
      return 'reussi';
    case 'echoue':
      return 'echoue';
    case 'rembourse':
      return 'rembourse';
    case 'en_attente':
      return derniere ? 'attente_longue' : 'en_cours';
  }
}

/** Paramètres de la page Paiements pour recommencer le même paiement. */
export function parametresRelance(p: Paiement): Record<string, string> {
  if (p.promesse_id) return { type: p.type, promesse: p.promesse_id };
  return p.bail_id ? { type: p.type, bail: p.bail_id } : {};
}
