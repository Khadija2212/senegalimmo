import { TypeBien, TypeTransaction } from '../../core/modeles/annonce';
import { CENTRE_DAKAR } from '../../shared/carte/style-carte';

export interface Quartier {
  nom: string;
  ville: string;
  /** Préposition devant le nom : « à Mermoz », « au Plateau », « aux Almadies ». */
  preposition: 'à' | 'au' | 'aux';
  centre: [number, number];
}

export const QUARTIERS: readonly Quartier[] = [
  { nom: 'Sacré-Cœur 3', ville: 'Dakar', preposition: 'à', centre: [-17.4652, 14.7186] },
  { nom: 'Mermoz', ville: 'Dakar', preposition: 'à', centre: [-17.4747, 14.7083] },
  { nom: 'Almadies', ville: 'Dakar', preposition: 'aux', centre: [-17.5101, 14.7449] },
  { nom: 'Ngor', ville: 'Dakar', preposition: 'à', centre: [-17.5116, 14.7477] },
  { nom: 'Ouakam', ville: 'Dakar', preposition: 'à', centre: [-17.492, 14.7215] },
  { nom: 'Point E', ville: 'Dakar', preposition: 'au', centre: [-17.4625, 14.696] },
  { nom: 'Plateau', ville: 'Dakar', preposition: 'au', centre: [-17.4383, 14.6681] },
  { nom: 'Liberté 6', ville: 'Dakar', preposition: 'à', centre: [-17.4592, 14.729] },
  { nom: 'Yoff', ville: 'Dakar', preposition: 'à', centre: [-17.4728, 14.7586] },
  { nom: 'Parcelles Assainies', ville: 'Dakar', preposition: 'aux', centre: [-17.4405, 14.7637] },
  { nom: 'Diamniadio', ville: 'Rufisque', preposition: 'à', centre: [-17.1832, 14.7238] },
  { nom: 'Thiès', ville: 'Thiès', preposition: 'à', centre: [-16.9262, 14.7886] },
  { nom: 'Saly', ville: 'Mbour', preposition: 'à', centre: [-17.0179, 14.4519] },
  { nom: 'Saint-Louis', ville: 'Saint-Louis', preposition: 'à', centre: [-16.4896, 16.0326] },
];

export const LIEU_DEFAUT = 'Dakar';

/** Lieux proposés dans la recherche : chaque quartier, puis chaque ville. */
export interface Lieu {
  nom: string;
  detail: string;
  preposition: Quartier['preposition'];
  centre: [number, number];
  estVille: boolean;
}

export const LIEUX: readonly Lieu[] = [
  ...QUARTIERS.map((q) => ({
    nom: q.nom,
    detail: q.ville,
    preposition: q.preposition,
    centre: q.centre,
    estVille: false,
  })),
  ...[...new Set(QUARTIERS.map((q) => q.ville))]
    .filter((ville) => !QUARTIERS.some((q) => q.nom === ville))
    .map((ville) => {
      const premier = QUARTIERS.find((q) => q.ville === ville) as Quartier;
      return {
        nom: ville,
        detail: 'Ville',
        preposition: 'à' as const,
        centre: ville === LIEU_DEFAUT ? CENTRE_DAKAR : premier.centre,
        estVille: true,
      };
    }),
];

export function trouverLieu(nom: string | undefined): Lieu | undefined {
  if (!nom) return undefined;
  const cle = sansAccent(nom);
  return LIEUX.find((l) => sansAccent(l.nom) === cle);
}

export interface LibelleType {
  valeur: TypeBien;
  singulier: string;
  pluriel: string;
  article: 'un' | 'une';
}

export const TYPES_BIEN: readonly LibelleType[] = [
  { valeur: 'appartement', singulier: 'appartement', pluriel: 'Appartements', article: 'un' },
  { valeur: 'studio', singulier: 'studio', pluriel: 'Studios', article: 'un' },
  { valeur: 'villa', singulier: 'villa', pluriel: 'Villas', article: 'une' },
  { valeur: 'maison', singulier: 'maison', pluriel: 'Maisons', article: 'une' },
  { valeur: 'chambre', singulier: 'chambre', pluriel: 'Chambres', article: 'une' },
  { valeur: 'terrain', singulier: 'terrain', pluriel: 'Terrains', article: 'un' },
  { valeur: 'bureau', singulier: 'bureau', pluriel: 'Bureaux', article: 'un' },
  {
    valeur: 'local_commercial',
    singulier: 'local commercial',
    pluriel: 'Locaux commerciaux',
    article: 'un',
  },
];

export const BUDGET_DEFAUT: Record<TypeTransaction, number> = { location: 400000, vente: 95000000 };

/** En dessous de ce budget, une recherche d'achat repart du budget par défaut, et inversement. */
export const SEUIL_BUDGET_VENTE = 5000000;

export function libelleType(valeur: TypeBien | undefined): LibelleType {
  return TYPES_BIEN.find((t) => t.valeur === valeur) ?? TYPES_BIEN[0];
}

/** Compare sans accents, sans casse, et lit « œ » comme « oe » (on tape souvent « coeur »). */
export function sansAccent(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .trim();
}
