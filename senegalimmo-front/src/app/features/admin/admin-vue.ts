/*
  Ce que voit un administrateur selon son niveau (RoleAdmin) : rubriques permises,
  indicateurs de l'en-tête et phrase qui résume le travail en attente.
*/
import { IndicateursAdmin, NiveauAdmin } from '../../core/modeles/admin';

export type Rubrique =
  | 'annonces'
  | 'comptes'
  | 'signalements'
  | 'notification'
  | 'retraits'
  | 'transactions'
  | 'commissions'
  | 'options';

export type Indicateur = keyof IndicateursAdmin;

/** Domaine « moderateur » des routes admin : modération, comptes, signalements, notifications. */
const MODERATION: readonly Rubrique[] = ['annonces', 'comptes', 'signalements', 'notification'];
/** Domaine « finance » : retraits, transactions, commissions, options premium. */
const FINANCE: readonly Rubrique[] = ['retraits', 'transactions', 'commissions', 'options'];

const RUBRIQUES: Readonly<Record<NiveauAdmin, readonly Rubrique[]>> = {
  moderateur: MODERATION,
  finance: FINANCE,
  super_admin: [...MODERATION, ...FINANCE],
};

const INDICATEURS: Readonly<Record<NiveauAdmin, readonly Indicateur[]>> = {
  moderateur: ['annonces_a_moderer', 'signalements_ouverts', 'agents_a_valider', 'utilisateurs'],
  finance: ['retraits_en_attente', 'volume', 'commissions'],
  super_admin: ['annonces_a_moderer', 'signalements_ouverts', 'retraits_en_attente', 'volume'],
};

/** Indicateurs exprimés en francs : affichés en notation courte. */
export const INDICATEURS_MONTANT: readonly Indicateur[] = ['volume', 'commissions'];

export function rubriquesPermises(niveau: NiveauAdmin): readonly Rubrique[] {
  return RUBRIQUES[niveau];
}

/** La rubrique demandée dans l'adresse si le niveau la couvre, sinon la première permise. */
export function rubriqueActive(demandee: string | undefined, niveau: NiveauAdmin): Rubrique {
  const permises = rubriquesPermises(niveau);
  return permises.find((r) => r === demandee) ?? permises[0];
}

export function indicateursVisibles(niveau: NiveauAdmin): readonly Indicateur[] {
  return INDICATEURS[niveau];
}

/** Nombre affiché à côté d'une rubrique : le travail qui l'attend. */
export function compteurRubrique(r: Rubrique, i: IndicateursAdmin): number | null {
  switch (r) {
    case 'annonces':
      return i.annonces_a_moderer;
    case 'comptes':
      return i.agents_a_valider || null;
    case 'signalements':
      return i.signalements_ouverts;
    case 'retraits':
      return i.retraits_en_attente;
    default:
      return null;
  }
}

function accorder(n: number, un: string, plusieurs: string): string {
  return `${n} ${n > 1 ? plusieurs : un}`;
}

/** « 4 annonces attendent une décision, 1 signalement ouvert et 2 retraits à valider. » */
export function resumerTravail(i: IndicateursAdmin, niveau: NiveauAdmin): string {
  const permises = rubriquesPermises(niveau);
  const morceaux: string[] = [];
  if (permises.includes('annonces') && i.annonces_a_moderer > 0) {
    morceaux.push(
      accorder(
        i.annonces_a_moderer,
        'annonce attend une décision',
        'annonces attendent une décision',
      ),
    );
  }
  if (permises.includes('signalements') && i.signalements_ouverts > 0) {
    morceaux.push(accorder(i.signalements_ouverts, 'signalement ouvert', 'signalements ouverts'));
  }
  if (permises.includes('comptes') && i.agents_a_valider > 0) {
    morceaux.push(accorder(i.agents_a_valider, 'agent à valider', 'agents à valider'));
  }
  if (permises.includes('retraits') && i.retraits_en_attente > 0) {
    morceaux.push(accorder(i.retraits_en_attente, 'retrait à valider', 'retraits à valider'));
  }
  if (!morceaux.length) return '';
  const dernier = morceaux.pop();
  return morceaux.length ? `${morceaux.join(', ')} et ${dernier}.` : `${dernier}.`;
}
