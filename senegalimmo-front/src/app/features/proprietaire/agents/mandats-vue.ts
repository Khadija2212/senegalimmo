/* Mandats en cours sur les biens du propriétaire, et biens encore libres d'être confiés. */
import { BienGere, Mandat, StatutContrat } from '../../../core/modeles/proprietaire';
import { TEXTES_PROPRIETAIRE } from '../textes';
import { Etat, dateCourte, nomComplet, photoPrincipale } from '../vue-commune';

const T = TEXTES_PROPRIETAIRE;
const EN_COURS: readonly StatutContrat[] = ['brouillon', 'en_signature', 'signe'];

export interface LigneMandat {
  cle: string;
  titre: string;
  photo: string | null;
  agent: string;
  detail: string;
  etat: Etat;
}

export interface BienLibre {
  id: string;
  titre: string;
}

export function mandatEnCours(m: Mandat, maintenant: Date = new Date()): boolean {
  return EN_COURS.includes(m.statut) && finDeJournee(m.date_fin) >= maintenant.getTime();
}

export function lignesMandats(
  biens: readonly BienGere[],
  maintenant: Date = new Date(),
): LigneMandat[] {
  return biens.flatMap((b) =>
    (b.mandats ?? [])
      .filter((m) => mandatEnCours(m, maintenant))
      .map((m) => ({
        cle: m.id,
        titre: b.titre,
        photo: photoPrincipale(b.medias),
        agent: T.agentNom(nomComplet(m.agent)),
        detail: T.mandatDetail(
          m.type === 'exclusif' ? T.typeExclusif : T.typeSimple,
          m.taux_commission,
          dateCourte(new Date(m.date_fin)),
        ),
        etat: etatMandat(m),
      })),
  );
}

/** Biens sans mandat en cours, vendus et loués exclus. */
export function biensLibres(
  biens: readonly BienGere[],
  maintenant: Date = new Date(),
): BienLibre[] {
  return biens
    .filter((b) => b.statut !== 'vendu' && b.statut !== 'loue')
    .filter((b) => !(b.mandats ?? []).some((m) => mandatEnCours(m, maintenant)))
    .map((b) => ({ id: b.id, titre: b.titre }));
}

function etatMandat(m: Mandat): Etat {
  if (m.statut === 'signe') return { libelle: T.mandatSigne, ton: 'ok', explication: null };
  if (m.statut === 'en_signature') {
    return { libelle: T.mandatEnSignature, ton: 'attente', explication: T.mandatEnSignatureTexte };
  }
  return { libelle: T.mandatBrouillon, ton: 'neutre', explication: null };
}

/** Dernière milliseconde du jour « AAAA-MM-JJ », en heure locale. */
function finDeJournee(iso: string): number {
  const [a, m, j] = iso.slice(0, 10).split('-').map(Number);
  return new Date(a, m - 1, j + 1).getTime() - 1;
}
