/*
  Range les demandes reçues par le propriétaire : ce qui attend sa réponse (ou son bail)
  d'un côté, ce qui est déjà traité de l'autre.
*/
import { fcfa } from '../../../core/format/fcfa';
import {
  DemandeRecue,
  IndicateursProprietaire,
  OffreRecue,
  VisiteRecue,
} from '../../../core/modeles/proprietaire';
import { TEXTES_PROPRIETAIRE } from '../textes';
import { Etat, dateCourte, dateLongue, nomComplet, photoPrincipale } from '../vue-commune';

const T = TEXTES_PROPRIETAIRE;
const POURCENT = 100;
const LOCALE = 'fr-FR';

export type GenreRequete = 'visite' | 'location' | 'offre';

export interface Requete {
  cle: string;
  id: string;
  genre: GenreRequete;
  aTraiter: boolean;
  annonceId: string;
  titre: string;
  photo: string | null;
  client: { id: string; nom: string };
  /** Morceau en gras puis suite du texte de détail. */
  fort: string;
  suite: string;
  message: string | null;
  etat: Etat;
  /** Libellé du bouton d'acceptation ; null quand il n'y a rien à accepter. */
  accepter: string | null;
  peutRefuser: boolean;
  /** Demande acceptée sans bail : le propriétaire crée le bail. */
  creerBail: boolean;
  date: number;
}

export interface Requetes {
  aTraiter: Requete[];
  traitees: Requete[];
}

export function grouperRequetes(
  demandes: readonly DemandeRecue[],
  offres: readonly OffreRecue[],
  visites: readonly VisiteRecue[],
  maintenant: Date = new Date(),
): Requetes {
  const toutes = [
    ...demandes.map(depuisDemande),
    ...offres.map(depuisOffre),
    ...visites.map((v) => depuisVisite(v, maintenant)),
  ];
  return {
    aTraiter: toutes.filter((r) => r.aTraiter).sort((a, b) => a.date - b.date),
    traitees: toutes.filter((r) => !r.aTraiter).sort((a, b) => b.date - a.date),
  };
}

/** Phrase du bandeau, tirée des indicateurs du tableau de bord. */
export function resumerIndicateurs(i: IndicateursProprietaire): string {
  const morceaux = [
    compter(i.demandes_en_attente, 'demande de location', 'demandes de location'),
    compter(i.offres_en_attente, "offre d'achat", "offres d'achat"),
    compter(i.visites_a_confirmer, 'visite à confirmer', 'visites à confirmer'),
  ].filter((m): m is string => m !== null);
  if (!morceaux.length) return T.rienATraiter;
  const total = i.demandes_en_attente + i.offres_en_attente + i.visites_a_confirmer;
  const liste =
    morceaux.length > 1
      ? `${morceaux.slice(0, -1).join(', ')} et ${morceaux[morceaux.length - 1]}`
      : morceaux[0];
  const verbe = total > 1 ? 'attendent' : 'attend';
  return `${liste.charAt(0).toUpperCase()}${liste.slice(1)} ${verbe} votre réponse.`;
}

export function nombreATraiter(i: IndicateursProprietaire): number {
  return i.demandes_en_attente + i.offres_en_attente + i.visites_a_confirmer;
}

function compter(n: number, un: string, plusieurs: string): string | null {
  if (n <= 0) return null;
  return n === 1 ? `une ${un}` : `${n} ${plusieurs}`;
}

function depuisDemande(d: DemandeRecue): Requete {
  const creerBail = d.statut === 'acceptee' && !d.bail;
  const enAttente = d.statut === 'en_attente';
  const entree = new Date(d.date_entree_souhaitee).toLocaleDateString(LOCALE, {
    day: 'numeric',
    month: 'long',
  });
  return {
    ...base('location', d.id, d.annonce, d.client, new Date(d.created_at).getTime()),
    aTraiter: enAttente || creerBail,
    fort: T.entreeLe(entree),
    suite: `${T.bailDe(d.duree_mois)}. ${T.de(nomComplet(d.client))}${
      d.client.profession ? T.profession(d.client.profession) : ''
    }.`,
    message: d.message,
    etat: etatDemande(d),
    accepter: enAttente ? T.accepter : null,
    peutRefuser: enAttente,
    creerBail,
  };
}

function etatDemande(d: DemandeRecue): Etat {
  const maj = dateCourte(new Date(d.updated_at));
  switch (d.statut) {
    case 'en_attente':
      return {
        libelle: T.enAttente,
        ton: 'attente',
        explication: T.recueLe(dateCourte(new Date(d.created_at))),
      };
    case 'acceptee':
      return {
        libelle: T.acceptee(maj),
        ton: 'ok',
        explication: d.bail ? T.bailCree : T.bailACreer,
      };
    case 'refusee':
      return { libelle: T.refusee(maj), ton: 'non', explication: d.motif_refus };
    case 'annulee':
      return { libelle: T.annulee, ton: 'neutre', explication: null };
  }
}

function depuisOffre(o: OffreRecue): Requete {
  const enAttente = o.statut === 'en_attente';
  const ecart = Math.round((1 - o.montant / o.annonce.prix) * POURCENT);
  return {
    ...base('offre', o.id, o.annonce, o.client, new Date(o.created_at).getTime()),
    aTraiter: enAttente,
    fort: T.offreDe(fcfa(o.montant)),
    suite: `${T.ecartPrix(ecart)}. ${T.de(nomComplet(o.client))}.`,
    message: o.message,
    etat: etatOffre(o),
    accepter: enAttente ? T.accepterOffre : null,
    peutRefuser: enAttente,
    creerBail: false,
  };
}

function etatOffre(o: OffreRecue): Etat {
  const maj = dateCourte(new Date(o.updated_at));
  switch (o.statut) {
    case 'en_attente':
      return {
        libelle: T.enAttente,
        ton: 'attente',
        explication: o.expire_le ? T.expireLe(dateCourte(new Date(o.expire_le))) : null,
      };
    case 'acceptee':
      return { libelle: T.acceptee(maj), ton: 'ok', explication: T.promesseEnvoyee };
    case 'refusee':
      return { libelle: T.refusee(maj), ton: 'non', explication: o.motif_refus };
    case 'retiree':
      return { libelle: T.retiree, ton: 'neutre', explication: null };
    case 'expiree':
      return { libelle: T.expiree, ton: 'neutre', explication: null };
  }
}

function depuisVisite(v: VisiteRecue, maintenant: Date): Requete {
  const quand = new Date(v.date_heure);
  const aRepondre = v.statut === 'demandee' && quand.getTime() > maintenant.getTime();
  return {
    ...base('visite', v.id, v.annonce, v.client, quand.getTime()),
    aTraiter: aRepondre,
    fort: dateLongue(quand),
    suite: `. ${T.de(nomComplet(v.client))}.`,
    message: null,
    etat: etatVisite(v, aRepondre),
    accepter: aRepondre ? T.confirmerVisite : null,
    peutRefuser: aRepondre,
    creerBail: false,
  };
}

function etatVisite(v: VisiteRecue, aRepondre: boolean): Etat {
  switch (v.statut) {
    case 'demandee':
      return aRepondre
        ? { libelle: T.aConfirmer, ton: 'attente', explication: null }
        : { libelle: T.datePassee, ton: 'neutre', explication: null };
    case 'confirmee':
      return { libelle: T.confirmee, ton: 'ok', explication: null };
    case 'effectuee':
      return { libelle: T.effectuee, ton: 'neutre', explication: null };
    case 'annulee':
      return { libelle: T.annulee, ton: 'neutre', explication: null };
    case 'refusee':
      return {
        libelle: T.refusee(dateCourte(new Date(v.date_heure))),
        ton: 'non',
        explication: v.motif_refus,
      };
  }
}

function base(
  genre: GenreRequete,
  id: string,
  annonce: VisiteRecue['annonce'],
  client: VisiteRecue['client'],
  date: number,
): Pick<Requete, 'cle' | 'id' | 'genre' | 'annonceId' | 'titre' | 'photo' | 'client' | 'date'> {
  return {
    cle: `${genre}-${id}`,
    id,
    genre,
    annonceId: annonce.id,
    titre: annonce.bien.titre,
    photo: photoPrincipale(annonce.bien.medias),
    client: { id: client.id, nom: nomComplet(client) },
    date,
  };
}
