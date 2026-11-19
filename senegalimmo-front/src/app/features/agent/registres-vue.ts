/* Registres des biens assignés et des mandats de l'agent. */
import { AnnonceDuBien, BienAssigne, Mandat, StatutAnnonce } from '../../core/modeles/agent';
import { StatutBien } from '../../core/modeles/annonce';
import { Etat, Ton, dateComplete, jourLocal, joursEntre, nomDe, photoDe } from './agent-vue';
import { TEXTES_AGENT } from './textes';

const T = TEXTES_AGENT;
const ROLE_PROPRIETAIRE = 'proprietaire';
/** En deçà, la fin prochaine du mandat est signalée. */
const JOURS_FIN_PROCHE = 30;
const ANNONCES_EN_COURS: readonly StatutAnnonce[] = ['en_moderation', 'publiee', 'suspendue'];

export type FiltreBien = 'tous' | StatutBien;

export const FILTRES_BIEN: readonly FiltreBien[] = [
  'tous',
  'disponible',
  'sous_offre',
  'loue',
  'vendu',
  'brouillon',
  'retire',
];

const TONS_BIEN: Readonly<Record<StatutBien, Ton>> = {
  brouillon: 'neutre',
  disponible: 'ok',
  sous_offre: 'attente',
  loue: 'ok',
  vendu: 'ok',
  retire: 'neutre',
};

export interface LigneBien {
  bien: BienAssigne;
  photo: string | null;
  proprietaire: string | null;
  etat: Etat;
  /** Annonce en modération, en ligne ou suspendue : on n'en publie pas une deuxième. */
  annonce: AnnonceDuBien | null;
}

export function libelleFiltre(f: FiltreBien): string {
  return f === 'tous' ? T.tous : T.statutsBien[f];
}

export function annonceEnCours(b: BienAssigne): AnnonceDuBien | null {
  return b.annonces.find((a) => ANNONCES_EN_COURS.includes(a.statut)) ?? null;
}

/** Le bien ne porte pas le propriétaire pour l'agent : on le lit sur la signature du mandat. */
export function proprietairesParBien(mandats: readonly Mandat[]): ReadonlyMap<string, string> {
  const noms = new Map<string, string>();
  for (const m of mandats) {
    const p = m.signatures.find((s) => s.signataire?.role === ROLE_PROPRIETAIRE)?.signataire;
    if (p && !noms.has(m.bien.id)) noms.set(m.bien.id, nomDe(p));
  }
  return noms;
}

export function lignesBiens(
  biens: readonly BienAssigne[],
  mandats: readonly Mandat[],
  filtre: FiltreBien,
): LigneBien[] {
  const proprietaires = proprietairesParBien(mandats);
  return biens
    .filter((b) => filtre === 'tous' || b.statut === filtre)
    .map((b) => {
      const annonce = annonceEnCours(b);
      const statut = b.statut ?? 'brouillon';
      return {
        bien: b,
        photo: photoDe(b.medias),
        proprietaire: proprietaires.get(b.id) ?? null,
        etat: {
          libelle: T.statutsBien[statut],
          ton: TONS_BIEN[statut],
          explication: etatAnnonce(annonce),
        },
        annonce,
      };
    });
}

export function compterParFiltre(
  biens: readonly BienAssigne[],
): Readonly<Record<FiltreBien, number>> {
  const n = Object.fromEntries(FILTRES_BIEN.map((f) => [f, 0])) as Record<FiltreBien, number>;
  n.tous = biens.length;
  for (const b of biens) if (b.statut) n[b.statut] += 1;
  return n;
}

function etatAnnonce(a: AnnonceDuBien | null): string {
  if (!a) return T.sansAnnonce;
  if (a.statut === 'publiee') return T.annonceEnLigne;
  return a.statut === 'suspendue' ? T.annonceSuspendue : T.annonceEnModeration;
}

export interface LigneMandat {
  mandat: Mandat;
  photo: string | null;
  proprietaire: string | null;
  type: string;
  commission: string;
  fin: string;
  etat: Etat;
  aSigner: boolean;
  peutRenouveler: boolean;
  peutResilier: boolean;
}

export function lignesMandats(
  mandats: readonly Mandat[],
  biens: readonly BienAssigne[],
  maintenant: Date = new Date(),
): LigneMandat[] {
  const proprietaires = proprietairesParBien(mandats);
  const photos = new Map(biens.map((b) => [b.id, photoDe(b.medias)]));
  return mandats
    .map((m) => {
      const etat = etatMandat(m, maintenant);
      return {
        mandat: m,
        photo: photos.get(m.bien.id) ?? null,
        proprietaire: proprietaires.get(m.bien.id) ?? null,
        type: T.typesMandat[m.type],
        commission: T.commission(String(m.taux_commission).replace('.', ',')),
        fin: dateComplete(jourLocal(m.date_fin)),
        etat,
        aSigner: m.statut === 'en_signature',
        peutRenouveler: m.statut === 'signe' || m.statut === 'expire',
        peutResilier: m.statut === 'signe' && etat.libelle !== T.expire,
      };
    })
    .sort((a, b) => rang(a) - rang(b) || a.mandat.date_fin.localeCompare(b.mandat.date_fin));
}

/** Les mandats qui demandent une action d'abord, les clos ensuite. */
function rang(l: LigneMandat): number {
  if (l.aSigner) return 0;
  return l.peutResilier ? 1 : 2;
}

function etatMandat(m: Mandat, maintenant: Date): Etat {
  const fin = jourLocal(m.date_fin);
  const jours = joursEntre(maintenant, fin);
  switch (m.statut) {
    case 'signe':
      if (jours < 0) return { libelle: T.expire, ton: 'neutre', explication: null };
      return jours <= JOURS_FIN_PROCHE
        ? { libelle: T.enCours, ton: 'attente', explication: T.finProche(jours) }
        : { libelle: T.enCours, ton: 'ok', explication: null };
    case 'en_signature':
      return { libelle: T.enSignature, ton: 'attente', explication: T.enSignatureExplication };
    case 'brouillon':
      return { libelle: T.brouillon, ton: 'neutre', explication: null };
    case 'expire':
      return { libelle: T.expire, ton: 'neutre', explication: null };
    case 'resilie':
      return { libelle: T.resilie, ton: 'neutre', explication: null };
  }
}
