/*
  Libellés et états des contrats : nature, autre partie, avancement des signatures,
  ce que le compte connecté peut faire (signer, relancer, payer).
*/
import { fcfa } from '../../core/format/fcfa';
import {
  Contrat,
  Echeancier,
  NatureContrat,
  Signature,
  StatutContrat,
} from '../../core/modeles/contrats';
import { TypePaiement } from '../../core/modeles/paiements';
import { Etat, jour, jourCourt } from './etat';
import { TEXTES_CONTRATS } from './textes';

const T = TEXTES_CONTRATS;
const FORMAT_TAUX = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const CHEMIN_CONTRATS = '/contrats/';

export interface LigneContrat {
  id: string;
  nature: NatureContrat;
  natureLibelle: string;
  reference: string;
  bien: string;
  lien: string;
  autre: string | null;
  detail: string;
  etat: Etat;
  aSigner: boolean;
}

/** Paiement que le locataire peut lancer depuis le bail, avec les paramètres de la page Paiements. */
export interface PaiementPropose {
  type: TypePaiement;
  libelle: string;
  parametres: Record<string, string>;
}

export function libelleNature(n: NatureContrat): string {
  return n === 'bail' ? T.bail : n === 'promesse_vente' ? T.promesse : T.mandat;
}

export function maSignature(c: Contrat, compteId: string): Signature | null {
  return c.signatures.find((s) => s.signataire_id === compteId) ?? null;
}

/** Le compte connecté a une signature en attente sur un contrat parti en signature. */
export function doitSigner(c: Contrat, compteId: string): boolean {
  return c.statut === 'en_signature' && maSignature(c, compteId)?.statut === 'en_attente';
}

/** On relance l'autre partie, jamais soi-même, et seulement pendant la signature. */
export function peutRelancer(c: Contrat, s: Signature, compteId: string): boolean {
  return c.statut === 'en_signature' && s.statut === 'en_attente' && s.signataire_id !== compteId;
}

/** « Awa Diop, propriétaire » : le premier signataire qui n'est pas le compte connecté. */
export function autrePartie(c: Contrat, compteId: string): string | null {
  const s = c.signatures.find((x) => x.signataire_id !== compteId && x.signataire);
  if (!s?.signataire) return null;
  const { prenom, nom } = s.signataire;
  return T.avec(`${prenom} ${nom}`, roleDans(c, s.signataire.role));
}

/** Le rôle du signataire tel qu'on le dit pour ce contrat : locataire, acheteur, agent... */
export function roleDans(c: Contrat, role: string): string {
  if (role === 'client') return c.nature === 'bail' ? T.locataire : T.acheteur;
  return role === 'proprietaire' || role === 'agent' || role === 'administrateur'
    ? T.roles[role]
    : role;
}

export function etatContrat(c: Contrat): Etat {
  const statut: StatutContrat = c.statut;
  switch (statut) {
    case 'brouillon':
      return { libelle: T.brouillon, ton: 'neutre', explication: T.brouillonExplication };
    case 'en_signature': {
      const signees = c.signatures.filter((s) => s.statut === 'signee').length;
      return {
        libelle: T.enSignature,
        ton: 'attente',
        explication: T.signaturesSur(signees, c.signatures.length),
      };
    }
    case 'signe':
      return {
        libelle: T.signe,
        ton: 'ok',
        explication: c.signe_le ? T.signeLe(jourCourt(c.signe_le)) : null,
      };
    case 'resilie':
      return { libelle: T.resilie, ton: 'non', explication: null };
    case 'expire':
      return { libelle: T.expire, ton: 'neutre', explication: null };
  }
}

export function etatSignature(s: Signature): Etat {
  switch (s.statut) {
    case 'signee':
      return {
        libelle: s.signe_le ? T.signeeLe(jour(s.signe_le)) : T.signe,
        ton: 'ok',
        explication: null,
      };
    case 'en_attente':
      return { libelle: T.enAttente, ton: 'attente', explication: null };
    case 'refusee':
      return { libelle: T.refusee, ton: 'non', explication: null };
    case 'expiree':
      return { libelle: T.expiree, ton: 'neutre', explication: null };
  }
}

/** Montant ou commission, selon la nature du contrat. */
export function detailContrat(c: Contrat): string {
  switch (c.nature) {
    case 'bail':
      return T.parMois(fcfa(c.loyer_mensuel + c.charges), c.duree_mois);
    case 'promesse_vente':
      return T.prixVente(fcfa(c.prix_vente));
    case 'mandat':
      return T.commission(taux(c.taux_commission), jour(c.date_fin));
  }
}

export function taux(t: number): string {
  return FORMAT_TAUX.format(t);
}

export function versLigne(c: Contrat, compteId: string): LigneContrat {
  return {
    id: c.id,
    nature: c.nature,
    natureLibelle: libelleNature(c.nature),
    reference: T.reference(c.reference),
    bien: c.bien.titre,
    lien: CHEMIN_CONTRATS + c.id,
    autre: autrePartie(c, compteId),
    detail: detailContrat(c),
    etat: etatContrat(c),
    aSigner: doitSigner(c, compteId),
  };
}

/** Les contrats à signer d'abord, puis du plus récent au plus ancien. */
export function ordonner(lignes: readonly LigneContrat[]): LigneContrat[] {
  return [...lignes].sort((a, b) => Number(b.aSigner) - Number(a.aSigner));
}

export function resumeContrats(lignes: readonly LigneContrat[]): string {
  const n = lignes.filter((l) => l.aSigner).length;
  if (n === 0) return T.aucunEnAttente;
  return n === 1 ? T.aSignerUn : T.aSignerPlusieurs(n);
}

/** Ce que le locataire règle ensuite : la caution d'abord, puis le prochain loyer. */
export function paiementPropose(bailId: string, e: Echeancier): PaiementPropose | null {
  if (e.caution > 0 && !e.caution_payee) {
    return {
      type: 'caution',
      libelle: T.payerCaution,
      parametres: { type: 'caution', bail: bailId },
    };
  }
  if (!e.prochaine_echeance) return null;
  return {
    type: 'loyer',
    libelle: T.payerLoyer,
    parametres: { type: 'loyer', bail: bailId, mois: e.prochaine_echeance.slice(0, 7) },
  };
}
