/*
  Demandes de location et offres d'achat reçues sur les biens gérés :
  celles qui attendent une réponse, puis celles déjà traitées.
*/
import { Client, DemandeGeree, OffreGeree } from '../../core/modeles/agent';
import { Annonce } from '../../core/modeles/annonce';
import { fcfa } from '../../core/format/fcfa';
import { Etat, dateComplete, dateCourte, nomDe, photoDe } from './agent-vue';
import { TEXTES_AGENT } from './textes';

const T = TEXTES_AGENT;
const POURCENT = 100;

export type GenreDemande = 'location' | 'offre';

export interface LigneClient {
  cle: string;
  id: string;
  genre: GenreDemande;
  annonce: Annonce;
  client: Client;
  photo: string | null;
  nomClient: string;
  /** Morceau en gras puis suite du texte de détail. */
  fort: string;
  suite: string;
  etat: Etat;
  enAttente: boolean;
  /** Seule une demande de location s'accepte chez l'agent ; une offre, seulement chez le propriétaire. */
  peutAccepter: boolean;
  date: number;
}

export interface DemandesClients {
  enAttente: LigneClient[];
  traitees: LigneClient[];
}

export function demandesClients(
  demandes: readonly DemandeGeree[],
  offres: readonly OffreGeree[],
): DemandesClients {
  const toutes = [...demandes.map(depuisDemande), ...offres.map(depuisOffre)];
  return {
    enAttente: toutes.filter((l) => l.enAttente).sort((a, b) => a.date - b.date),
    traitees: toutes.filter((l) => !l.enAttente).sort((a, b) => b.date - a.date),
  };
}

function depuisDemande(d: DemandeGeree): LigneClient {
  const recue = new Date(d.created_at);
  const enAttente = d.statut === 'en_attente';
  const etat: Etat = enAttente
    ? { libelle: T.attenteEtat, ton: 'attente', explication: T.recueLe(dateCourte(recue)) }
    : d.statut === 'acceptee'
      ? { libelle: T.acceptee, ton: 'ok', explication: d.bail ? null : T.bailPrepare }
      : d.statut === 'refusee'
        ? { libelle: T.refusee, ton: 'non', explication: d.motif_refus }
        : { libelle: T.annulee, ton: 'neutre', explication: null };
  return {
    ...base('location', d.id, d.annonce, d.client, recue),
    fort: T.entreeLe(dateComplete(new Date(d.date_entree_souhaitee)), d.duree_mois),
    suite: d.client.profession ? `, ${d.client.profession}` : '',
    etat,
    enAttente,
    peutAccepter: enAttente,
  };
}

function depuisOffre(o: OffreGeree): LigneClient {
  const recue = new Date(o.created_at);
  const enAttente = o.statut === 'en_attente';
  const ecart = Math.round((1 - o.montant / o.annonce.prix) * POURCENT);
  return {
    ...base('offre', o.id, o.annonce, o.client, recue),
    fort: T.offreDe(fcfa(o.montant)),
    suite: T.ecartPrix(ecart),
    etat: etatOffre(o, recue),
    enAttente,
    peutAccepter: false,
  };
}

function etatOffre(o: OffreGeree, recue: Date): Etat {
  switch (o.statut) {
    case 'en_attente':
      return { libelle: T.attenteEtat, ton: 'attente', explication: T.recueLe(dateCourte(recue)) };
    case 'acceptee':
      return { libelle: T.acceptee, ton: 'ok', explication: null };
    case 'refusee':
      return { libelle: T.refusee, ton: 'non', explication: o.motif_refus };
    case 'retiree':
      return { libelle: T.retiree, ton: 'neutre', explication: null };
    case 'expiree':
      return { libelle: T.expiree, ton: 'neutre', explication: null };
  }
}

function base(
  genre: GenreDemande,
  id: string,
  annonce: Annonce,
  client: Client,
  recue: Date,
): Pick<
  LigneClient,
  'cle' | 'id' | 'genre' | 'annonce' | 'client' | 'photo' | 'nomClient' | 'date'
> {
  return {
    cle: `${genre}-${id}`,
    id,
    genre,
    annonce,
    client,
    photo: photoDe(annonce.bien.medias),
    nomClient: nomDe(client),
    date: recue.getTime(),
  };
}
