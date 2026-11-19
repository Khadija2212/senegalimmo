/*
  Range les visites des biens gérés par l'agent : à venir (à confirmer ou confirmées),
  passées sans compte rendu, puis l'historique.
*/
import { Client, VisiteGeree } from '../../core/modeles/agent';
import { Annonce } from '../../core/modeles/annonce';
import { Etat, dateLongue, nomDe, photoDe } from './agent-vue';
import { TEXTES_AGENT } from './textes';

const T = TEXTES_AGENT;

export type GroupeVisite = 'aVenir' | 'sansCompteRendu' | 'historique';

export interface LigneVisite {
  cle: string;
  id: string;
  groupe: GroupeVisite;
  annonce: Annonce;
  client: Client;
  photo: string | null;
  quand: string;
  nomClient: string;
  etat: Etat;
  peutConfirmer: boolean;
  peutReprogrammer: boolean;
  peutRediger: boolean;
  compteRendu: string | null;
  date: number;
}

export interface GroupesVisites {
  aVenir: LigneVisite[];
  sansCompteRendu: LigneVisite[];
  historique: LigneVisite[];
}

export function grouperVisites(
  visites: readonly VisiteGeree[],
  maintenant: Date = new Date(),
): GroupesVisites {
  const lignes = visites.map((v) => versLigne(v, maintenant));
  const de = (g: GroupeVisite, recentes: boolean): LigneVisite[] =>
    lignes
      .filter((l) => l.groupe === g)
      .sort((a, b) => (recentes ? b.date - a.date : a.date - b.date));
  return {
    aVenir: de('aVenir', false),
    sansCompteRendu: de('sansCompteRendu', false),
    historique: de('historique', true),
  };
}

function groupeDe(v: VisiteGeree, aVenir: boolean): GroupeVisite {
  if ((v.statut === 'demandee' || v.statut === 'confirmee') && aVenir) return 'aVenir';
  const passeeSansNote =
    (v.statut === 'confirmee' && !aVenir) || (v.statut === 'effectuee' && !v.compte_rendu);
  return passeeSansNote ? 'sansCompteRendu' : 'historique';
}

function versLigne(v: VisiteGeree, maintenant: Date): LigneVisite {
  const quand = new Date(v.date_heure);
  const aVenir = quand.getTime() > maintenant.getTime();
  const groupe = groupeDe(v, aVenir);
  return {
    cle: `visite-${v.id}`,
    id: v.id,
    groupe,
    annonce: v.annonce,
    client: v.client,
    photo: photoDe(v.annonce.bien.medias),
    quand: dateLongue(quand),
    nomClient: nomDe(v.client),
    etat: etatVisite(v, groupe),
    peutConfirmer: groupe === 'aVenir' && v.statut === 'demandee',
    peutReprogrammer: groupe === 'aVenir' && v.statut === 'confirmee',
    peutRediger: groupe === 'sansCompteRendu',
    compteRendu: v.compte_rendu?.contenu ?? null,
    date: quand.getTime(),
  };
}

function etatVisite(v: VisiteGeree, groupe: GroupeVisite): Etat {
  if (groupe === 'sansCompteRendu') {
    return { libelle: T.rediger, ton: 'attente', explication: T.redigerExplication };
  }
  switch (v.statut) {
    case 'demandee':
      return groupe === 'aVenir'
        ? { libelle: T.aConfirmerEtat, ton: 'attente', explication: T.aConfirmerExplication }
        : { libelle: T.sansReponse, ton: 'neutre', explication: null };
    case 'confirmee':
      return { libelle: T.confirmeeEtat, ton: 'ok', explication: T.confirmeeExplication };
    case 'effectuee':
      return {
        libelle: T.effectuee,
        ton: 'neutre',
        explication: v.compte_rendu
          ? T.interet(T.niveaux[v.compte_rendu.interet_client].toLowerCase())
          : null,
      };
    case 'refusee':
      return { libelle: T.refusee, ton: 'non', explication: v.motif_refus };
    case 'annulee':
      return { libelle: T.annulee, ton: 'neutre', explication: null };
  }
}
