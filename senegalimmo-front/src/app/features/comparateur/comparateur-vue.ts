/* Logique de présentation du comparateur, sans Angular. */
import { Annonce } from '../../core/modeles/annonce';
import { fcfa, nombre } from '../../core/format/fcfa';
import { TEXTES_COMPARATEUR } from './textes';

const T = TEXTES_COMPARATEUR;

/** Mêmes bornes que RechercheController::COMPARAISON_MIN et COMPARAISON_MAX. */
export const COMPARAISON_MIN = 2;
export const COMPARAISON_MAX = 4;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Sens = 'min' | 'max';

export interface Cellule {
  texte: string;
  meilleure: boolean;
}

export interface Ligne {
  cle: string;
  libelle: string;
  cellules: Cellule[];
}

interface Critere {
  cle: string;
  libelle: (annonces: readonly Annonce[]) => string;
  texte: (a: Annonce) => string;
  valeur?: (a: Annonce) => number | null;
  sens?: Sens;
  /** Un prix de vente et un loyer ne se comparent pas : pas de gras si les deux sont mêlés. */
  memeTransactionRequise?: boolean;
}

/** Les identifiants du paramètre « ids » s'il est donné, sinon la sélection en cours. */
export function idsAComparer(
  parametre: string | undefined,
  selection: readonly string[],
): string[] {
  const source = parametre?.trim() ? parametre.split(',') : selection;
  const ids = source.map((id) => id.trim()).filter((id) => UUID.test(id));
  return [...new Set(ids)].slice(0, COMPARAISON_MAX);
}

/** Repère la meilleure valeur ; rien n'est mis en avant s'il n'y a pas d'écart à montrer. */
export function meilleurs(valeurs: readonly (number | null)[], sens: Sens): boolean[] {
  const chiffres = valeurs.filter((v): v is number => v !== null);
  if (chiffres.length < COMPARAISON_MIN) return valeurs.map(() => false);
  const cible = sens === 'min' ? Math.min(...chiffres) : Math.max(...chiffres);
  if (chiffres.every((v) => v === cible)) return valeurs.map(() => false);
  return valeurs.map((v) => v === cible);
}

export function prixAuM2(a: Annonce): number | null {
  return a.bien.surface > 0 ? Math.round(a.prix / a.bien.surface) : null;
}

export function photoPrincipale(a: Annonce): string | null {
  const photos = a.bien.medias.filter((m) => m.type === 'photo');
  return [...photos].sort((x, y) => x.ordre - y.ordre)[0]?.lien ?? null;
}

export function memeTransaction(annonces: readonly Annonce[]): boolean {
  return annonces.every((a) => a.type_transaction === annonces[0]?.type_transaction);
}

function libellePrix(annonces: readonly Annonce[], vente: string, location: string): string {
  if (!memeTransaction(annonces)) return T.prixOuLoyer;
  return annonces[0]?.type_transaction === 'location' ? location : vente;
}

/** Charges et caution ne concernent que la location. */
function montantLocation(a: Annonce, montant: number): number | null {
  return a.type_transaction === 'location' ? montant : null;
}

function texteMontant(v: number | null): string {
  if (v === null) return T.sansObjet;
  return v === 0 ? T.aucune : fcfa(v);
}

const CRITERES: readonly Critere[] = [
  {
    cle: 'prix',
    libelle: (l) => libellePrix(l, T.prix, T.loyer),
    texte: (a) => fcfa(a.prix) + (a.type_transaction === 'location' ? T.parMois : ''),
    valeur: (a) => a.prix,
    sens: 'min',
    memeTransactionRequise: true,
  },
  {
    cle: 'charges',
    libelle: () => T.charges,
    texte: (a) => texteMontant(montantLocation(a, a.charges)),
    valeur: (a) => montantLocation(a, a.charges),
    sens: 'min',
  },
  {
    cle: 'caution',
    libelle: () => T.caution,
    texte: (a) => texteMontant(montantLocation(a, a.caution)),
    valeur: (a) => montantLocation(a, a.caution),
    sens: 'min',
  },
  {
    cle: 'surface',
    libelle: () => T.surface,
    texte: (a) => `${nombre(a.bien.surface)} ${T.metreCarre}`,
    valeur: (a) => a.bien.surface,
    sens: 'max',
  },
  {
    cle: 'prix-m2',
    libelle: (l) => libellePrix(l, T.prixM2, T.loyerM2),
    texte: (a) => {
      const v = prixAuM2(a);
      return v === null ? T.sansObjet : fcfa(v) + T.leMetreCarre;
    },
    valeur: prixAuM2,
    sens: 'min',
    memeTransactionRequise: true,
  },
  {
    cle: 'pieces',
    libelle: () => T.pieces,
    texte: (a) => nombre(a.bien.nombre_pieces),
    valeur: (a) => a.bien.nombre_pieces,
    sens: 'max',
  },
  {
    cle: 'chambres',
    libelle: () => T.chambres,
    texte: (a) => nombre(a.bien.nombre_chambres),
    valeur: (a) => a.bien.nombre_chambres,
    sens: 'max',
  },
  { cle: 'meuble', libelle: () => T.meuble, texte: (a) => (a.bien.meuble ? T.oui : T.non) },
  { cle: 'type', libelle: () => T.type, texte: (a) => T.types[a.bien.type] },
  {
    cle: 'verifiee',
    libelle: () => T.verification,
    texte: (a) => (a.badge_verifie ? T.annonceVerifiee : ''),
  },
  {
    cle: 'proprietaire',
    libelle: () => T.proprietaire,
    texte: (a) =>
      a.bien.proprietaire
        ? `${a.bien.proprietaire.prenom} ${a.bien.proprietaire.nom}`
        : T.nonCommunique,
  },
];

function enGras(c: Critere, annonces: readonly Annonce[]): boolean[] {
  const { valeur, sens } = c;
  const comparable = valeur && sens && (!c.memeTransactionRequise || memeTransaction(annonces));
  return comparable
    ? meilleurs(
        annonces.map((a) => valeur(a)),
        sens,
      )
    : annonces.map(() => false);
}

function ligne(c: Critere, annonces: readonly Annonce[]): Ligne {
  const gras = enGras(c, annonces);
  return {
    cle: c.cle,
    libelle: c.libelle(annonces),
    cellules: annonces.map((a, i) => ({ texte: c.texte(a), meilleure: gras[i] })),
  };
}

export function lignesComparaison(annonces: readonly Annonce[]): Ligne[] {
  return CRITERES.map((c) => ligne(c, annonces));
}
