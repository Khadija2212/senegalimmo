/*
  Une ligne par bien du propriétaire, avec l'annonce qui le représente :
  état de l'annonce en clair et actions permises par son statut.
*/
import { TypeTransaction } from '../../../core/modeles/annonce';
import { AnnonceGeree, BienGere, StatutAnnonce } from '../../../core/modeles/proprietaire';
import { TEXTES_PROPRIETAIRE } from '../textes';
import { Etat, dateCourte, photoPrincipale } from '../vue-commune';

const T = TEXTES_PROPRIETAIRE;
/** Statuts d'une annonce encore active, préférée aux anciennes pour représenter le bien. */
const EN_COURS: readonly StatutAnnonce[] = ['en_moderation', 'publiee', 'suspendue'];

export interface LigneBien {
  bienId: string;
  annonceId: string | null;
  titre: string;
  lieu: string;
  photo: string | null;
  prix: number | null;
  transaction: TypeTransaction | null;
  vues: number | null;
  etat: Etat;
  peutSuspendre: boolean;
  peutReprendre: boolean;
  peutConclure: boolean;
  peutMettreEnAvant: boolean;
}

export function lignesBiens(
  biens: readonly BienGere[],
  annonces: readonly AnnonceGeree[],
  maintenant: Date = new Date(),
): LigneBien[] {
  return biens.map((b) => ligne(b, annonceDe(b.id, annonces), maintenant));
}

/** L'annonce en cours du bien, sinon la plus récente. */
export function annonceDe(bienId: string, annonces: readonly AnnonceGeree[]): AnnonceGeree | null {
  const duBien = annonces
    .filter((a) => a.bien_id === bienId)
    .sort((x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime());
  return duBien.find((a) => EN_COURS.includes(a.statut)) ?? duBien[0] ?? null;
}

function ligne(b: BienGere, a: AnnonceGeree | null, maintenant: Date): LigneBien {
  const statut = a?.statut ?? null;
  return {
    bienId: b.id,
    annonceId: a?.id ?? null,
    titre: b.titre,
    lieu: `${b.quartier}, ${b.ville}`,
    photo: photoPrincipale(b.medias),
    prix: a ? a.prix + (a.type_transaction === 'location' ? a.charges : 0) : null,
    transaction: a?.type_transaction ?? null,
    vues: a?.nombre_vues ?? null,
    etat: a
      ? etatAnnonce(a, maintenant)
      : { libelle: T.sansAnnonce, ton: 'neutre', explication: T.sansAnnonceTexte },
    peutSuspendre: statut === 'publiee' || statut === 'en_moderation',
    peutReprendre: statut === 'suspendue',
    peutConclure: statut === 'publiee',
    peutMettreEnAvant: statut === 'publiee',
  };
}

export function etatAnnonce(a: AnnonceGeree, maintenant: Date = new Date()): Etat {
  switch (a.statut) {
    case 'en_moderation':
      return { libelle: T.statutModeration, ton: 'attente', explication: T.moderationTexte };
    case 'publiee':
      return { libelle: T.statutPubliee, ton: 'ok', explication: miseEnAvant(a, maintenant) };
    case 'suspendue':
      return { libelle: T.statutSuspendue, ton: 'neutre', explication: T.suspendueTexte };
    case 'rejetee':
      return { libelle: T.statutRejetee, ton: 'non', explication: T.rejeteeTexte };
    case 'louee':
      return { libelle: T.statutLouee, ton: 'ok', explication: null };
    case 'vendue':
      return { libelle: T.statutVendue, ton: 'ok', explication: null };
    case 'expiree':
      return { libelle: T.statutExpiree, ton: 'neutre', explication: null };
  }
}

function miseEnAvant(a: AnnonceGeree, maintenant: Date): string | null {
  if (!a.premium_jusquau) return null;
  const fin = new Date(a.premium_jusquau);
  return fin.getTime() > maintenant.getTime() ? T.enAvantJusquau(dateCourte(fin)) : null;
}
