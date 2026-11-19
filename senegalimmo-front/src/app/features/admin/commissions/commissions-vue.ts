/* Règles de commission rangées par type : celle en vigueur, celles à venir, celles remplacées. */
import { TypeTransaction } from '../../../core/modeles/annonce';
import { RegleCommission } from '../../../core/modeles/admin';

const LONGUEUR_JOUR_ISO = 10;

export interface ReglesDuType {
  type: TypeTransaction;
  active: RegleCommission | null;
  aVenir: RegleCommission[];
  remplacees: RegleCommission[];
}

const TYPES: readonly TypeTransaction[] = ['location', 'vente'];

function jour(r: RegleCommission): string {
  return r.actif_depuis.slice(0, LONGUEUR_JOUR_ISO);
}

/** `aujourdhui` au format « 2026-11-19 ». */
export function classerRegles(
  regles: readonly RegleCommission[],
  aujourdhui: string,
): ReglesDuType[] {
  return TYPES.map((type) => {
    const duType = regles
      .filter((r) => r.type_transaction === type)
      .sort((a, b) => jour(b).localeCompare(jour(a)));
    const passees = duType.filter((r) => jour(r) <= aujourdhui);
    return {
      type,
      active: passees[0] ?? null,
      aVenir: duType.filter((r) => jour(r) > aujourdhui).reverse(),
      remplacees: passees.slice(1),
    };
  });
}

/** Taux écrit à la française : 7.5 devient « 7,5 ». */
export function tauxLisible(taux: number): string {
  return String(taux).replace('.', ',');
}
