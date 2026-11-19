/* Libellés des écritures et des retraits du portefeuille, et règles du formulaire de retrait. */
import { fcfa } from '../../core/format/fcfa';
import { Ecriture, MethodeRetrait, Retrait, TypeEcriture } from '../../core/modeles/portefeuille';
import { METHODES_RETRAIT, TEXTES_PORTEFEUILLE } from './textes';

const T = TEXTES_PORTEFEUILLE;
const LOCALE = 'fr-FR';
/** RetraitController : 7 à 20 chiffres, espaces et « + » admis. */
export const NUMERO_BENEFICIAIRE = /^[0-9+ ]{7,20}$/;

export type Ton = 'ok' | 'attente' | 'non' | 'neutre';

export interface LigneEcriture {
  id: string;
  date: string;
  libelle: string;
  nature: string;
  /** Montant signé, en texte : « + 250 000 FCFA ». */
  montant: string;
  credit: boolean;
  soldeApres: string;
}

export interface LigneRetrait {
  id: string;
  montant: string;
  vers: string;
  demande: string;
  statut: string;
  ton: Ton;
  explication: string | null;
}

const NATURES: Readonly<Record<TypeEcriture, string>> = {
  credit_loyer: T.creditLoyer,
  credit_vente: T.creditVente,
  commission_agent: T.commission,
  blocage_retrait: T.blocage,
  debit_retrait: T.debit,
  deblocage: T.deblocage,
};

export function ligneEcriture(e: Ecriture): LigneEcriture {
  const credit = e.montant >= 0;
  return {
    id: e.id,
    date: dateCourte(e.date),
    libelle: e.libelle,
    nature: NATURES[e.type],
    montant: `${credit ? '+' : '−'} ${fcfa(Math.abs(e.montant))}`,
    credit,
    soldeApres: fcfa(e.solde_apres),
  };
}

export function ligneRetrait(r: Retrait): LigneRetrait {
  return {
    id: r.id,
    montant: fcfa(r.montant),
    vers: T.retraitVers(libelleMethode(r.methode), r.numero_beneficiaire),
    demande: r.demande_le ? T.demandeLe(dateCourte(r.demande_le)) : '',
    ...etatRetrait(r),
  };
}

function etatRetrait(r: Retrait): Pick<LigneRetrait, 'statut' | 'ton' | 'explication'> {
  switch (r.statut) {
    case 'demande':
      return { statut: T.statutDemande, ton: 'attente', explication: null };
    case 'approuve':
      return { statut: T.statutApprouve, ton: 'attente', explication: T.approuveTexte };
    case 'verse':
      return {
        statut: T.statutVerse,
        ton: 'ok',
        explication: r.traite_le ? T.verseLe(dateCourte(r.traite_le)) : null,
      };
    case 'rejete':
      return {
        statut: T.statutRejete,
        ton: 'non',
        explication: r.motif_rejet
          ? `${T.motif(r.motif_rejet.replace(/\.$/, ''))}. ${T.rejeteTexte}`
          : T.rejeteTexte,
      };
  }
}

export function libelleMethode(m: MethodeRetrait): string {
  return METHODES_RETRAIT.find((x) => x.valeur === m)?.libelle ?? m;
}

/** Erreur du montant saisi, ou null s'il est acceptable. */
export function erreurMontant(
  montant: number | null,
  minimum: number,
  disponible: number,
): string | null {
  if (montant === null || Number.isNaN(montant)) return T.requis;
  if (!Number.isInteger(montant)) return T.montantEntier;
  if (montant < minimum) return T.montantTropPetit(fcfa(minimum));
  if (montant > disponible) return T.montantTropGrand;
  return null;
}

function dateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
