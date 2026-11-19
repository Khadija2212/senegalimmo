/*
  Range les visites, demandes de location et offres d'achat du client en trois groupes :
  ce qui attend son action, ce qui attend une réponse, ce qui est terminé.
*/
import { fcfa } from '../../core/format/fcfa';
import { Annonce } from '../../core/modeles/annonce';
import { DemandeLocation, OffreAchat, Visite } from '../../core/modeles/demarches';
import { dateCourte, dateLongue, dateLongueSansHeure, jourRelatif } from './dates';
import { TEXTES_ESPACE } from './textes';

const T = TEXTES_ESPACE;
const MS_PAR_JOUR = 86_400_000;
const POURCENT = 100;
const CHEMIN_ANNONCE = '/annonces/';
const CHEMIN_CONTRATS = '/contrats';

export type Groupe = 'faire' | 'attente' | 'termine';
export type Ton = 'ok' | 'attente' | 'non' | 'neutre';
export type Genre = 'visite' | 'location' | 'offre';

export interface Etat {
  libelle: string;
  ton: Ton;
  explication: string | null;
}

export interface Demarche {
  cle: string;
  id: string;
  genre: Genre;
  groupe: Groupe;
  annonce: Annonce;
  photo: string | null;
  /** Morceau en gras puis suite du texte de détail. */
  fort: string;
  suite: string;
  etat: Etat;
  /** Lien principal : signer, voir le bail, voir l'annonce... */
  lien: { libelle: string; chemin: string } | null;
  /** Personne à qui écrire, et son rôle. */
  interlocuteur: { id: string; nom: string; role: string } | null;
  /** Personne qui gère le bien, prévenue des changements. */
  responsable: string | null;
  peutReprogrammer: boolean;
  peutAnnuler: boolean;
  peutRetirer: boolean;
  /** Pour l'ordre d'affichage dans un groupe. */
  date: number;
}

export interface Groupes {
  faire: Demarche[];
  attente: Demarche[];
  termine: Demarche[];
}

export function grouperDemarches(
  visites: readonly Visite[],
  demandes: readonly DemandeLocation[],
  offres: readonly OffreAchat[],
  maintenant: Date = new Date(),
): Groupes {
  const toutes = [
    ...visites.map((v) => depuisVisite(v, maintenant)),
    ...demandes.map(depuisDemande),
    ...offres.map((o) => depuisOffre(o, maintenant)),
  ];
  const de = (g: Groupe): Demarche[] =>
    toutes
      .filter((d) => d.groupe === g)
      .sort((a, b) => (g === 'termine' ? b.date - a.date : a.date - b.date));
  return { faire: de('faire'), attente: de('attente'), termine: de('termine') };
}

/** Phrase du bandeau : ce qui compte le plus en ce moment. */
export function resumer(g: Groupes, maintenant: Date = new Date()): string {
  const visitesConfirmees = g.faire.filter((d) => d.genre === 'visite');
  const aSigner = g.faire.filter((d) => d.genre !== 'visite');
  const morceaux: string[] = [];
  if (visitesConfirmees.length === 1) {
    morceaux.push(
      `une visite est confirmée pour ${jourRelatif(visitesConfirmees[0].date, maintenant)}`,
    );
  } else if (visitesConfirmees.length > 1) {
    morceaux.push(`${visitesConfirmees.length} visites sont confirmées`);
  }
  if (aSigner.length === 1) morceaux.push(`${articleSigner(aSigner[0])} attend votre signature`);
  else if (aSigner.length > 1)
    morceaux.push(`${aSigner.length} contrats attendent votre signature`);
  if (!morceaux.length) {
    const n = g.attente.length;
    if (n === 1) return 'Une démarche attend une réponse.';
    return n > 1 ? `${n} démarches attendent une réponse.` : T.rienEnAttente;
  }
  const phrase = morceaux.join(' et ');
  return `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)}.`;
}

function depuisVisite(v: Visite, maintenant: Date): Demarche {
  const quand = new Date(v.date_heure);
  const aVenir = quand.getTime() > maintenant.getTime();
  const proprietaire = v.annonce.bien.proprietaire;
  const gere = v.agent
    ? { id: v.agent.id, nom: `${v.agent.prenom} ${v.agent.nom}`, role: T.roleAgent }
    : proprietaire
      ? {
          id: proprietaire.id,
          nom: `${proprietaire.prenom} ${proprietaire.nom}`,
          role: T.roleProprietaire,
        }
      : null;
  const enCours = (v.statut === 'demandee' || v.statut === 'confirmee') && aVenir;
  const groupe: Groupe = !enCours ? 'termine' : v.statut === 'confirmee' ? 'faire' : 'attente';
  return {
    ...base('visite', v.id, v.annonce, groupe, quand.getTime()),
    fort: dateLongue(quand),
    suite: gere ? T.avec(gere.nom, gere.role) : '',
    etat: etatVisite(v, aVenir),
    lien:
      groupe === 'termine' && v.statut === 'effectuee' && v.annonce.type_transaction === 'location'
        ? { libelle: T.demanderLocation, chemin: CHEMIN_ANNONCE + v.annonce.id }
        : null,
    interlocuteur: groupe === 'faire' ? gere : null,
    responsable: gere?.nom ?? null,
    peutReprogrammer: enCours,
    peutAnnuler: enCours,
  };
}

function etatVisite(v: Visite, aVenir: boolean): Etat {
  switch (v.statut) {
    case 'confirmee':
      return aVenir
        ? { libelle: T.confirmee, ton: 'ok', explication: T.confirmeeExplication }
        : { libelle: T.datePassee, ton: 'neutre', explication: null };
    case 'demandee':
      return aVenir
        ? { libelle: T.demandee, ton: 'attente', explication: T.demandeeExplication }
        : { libelle: T.datePassee, ton: 'neutre', explication: null };
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

function depuisDemande(d: DemandeLocation): Demarche {
  const maj = new Date(d.updated_at);
  const groupe: Groupe =
    d.statut === 'acceptee' ? 'faire' : d.statut === 'en_attente' ? 'attente' : 'termine';
  const etat: Etat =
    d.statut === 'acceptee'
      ? {
          libelle: T.acceptee(dateCourte(maj)),
          ton: 'ok',
          explication: d.bail ? T.bailPret : T.bailEnPreparation,
        }
      : d.statut === 'en_attente'
        ? { libelle: T.attenteProprietaire, ton: 'attente', explication: null }
        : d.statut === 'refusee'
          ? { libelle: T.refusee(dateCourte(maj)), ton: 'non', explication: d.motif_refus }
          : { libelle: T.annulee, ton: 'neutre', explication: null };
  const proprietaire = d.annonce.bien.proprietaire;
  return {
    responsable: nomDe(proprietaire),
    ...base('location', d.id, d.annonce, groupe, new Date(d.created_at).getTime()),
    fort: `${T.entreeLe} ${dateLongueSansHeure(new Date(d.date_entree_souhaitee))}`,
    suite: `${T.bailDe(d.duree_mois)}${T.envoyeeLe(dateCourte(new Date(d.created_at)))}`,
    etat,
    lien:
      d.statut === 'acceptee' && d.bail
        ? { libelle: T.voirBail, chemin: `${CHEMIN_CONTRATS}/${d.bail.id}` }
        : groupe === 'termine'
          ? { libelle: T.chercherProche, chemin: '/' }
          : { libelle: T.voirAnnonce, chemin: CHEMIN_ANNONCE + d.annonce.id },
    interlocuteur:
      groupe === 'faire' && proprietaire
        ? {
            id: proprietaire.id,
            nom: `${proprietaire.prenom} ${proprietaire.nom}`,
            role: T.roleProprietaire,
          }
        : null,
    peutAnnuler: d.statut === 'en_attente',
  };
}

function depuisOffre(o: OffreAchat, maintenant: Date): Demarche {
  const maj = new Date(o.updated_at);
  const groupe: Groupe =
    o.statut === 'acceptee' ? 'faire' : o.statut === 'en_attente' ? 'attente' : 'termine';
  const ecart = Math.round((1 - o.montant / o.annonce.prix) * POURCENT);
  const proprietaire = o.annonce.bien.proprietaire;
  return {
    responsable: nomDe(proprietaire),
    ...base('offre', o.id, o.annonce, groupe, new Date(o.created_at).getTime()),
    fort: `${T.votreOffre} ${fcfa(o.montant)}`,
    suite: T.ecartPrix(ecart),
    etat: etatOffre(o, maj, maintenant),
    lien:
      o.statut === 'acceptee' && o.promesse_vente
        ? { libelle: T.signerPromesse, chemin: `${CHEMIN_CONTRATS}/${o.promesse_vente.id}` }
        : null,
    interlocuteur:
      groupe === 'faire' && proprietaire
        ? {
            id: proprietaire.id,
            nom: `${proprietaire.prenom} ${proprietaire.nom}`,
            role: T.roleProprietaire,
          }
        : null,
    peutRetirer: o.statut === 'en_attente',
  };
}

function etatOffre(o: OffreAchat, maj: Date, maintenant: Date): Etat {
  switch (o.statut) {
    case 'acceptee':
      return { libelle: T.acceptee(dateCourte(maj)), ton: 'ok', explication: T.promessePrete };
    case 'en_attente': {
      const fin = o.expire_le ? new Date(o.expire_le) : null;
      const jours = fin
        ? Math.max(0, Math.ceil((fin.getTime() - maintenant.getTime()) / MS_PAR_JOUR))
        : 0;
      return {
        libelle: T.offreEnAttente,
        ton: 'attente',
        explication: fin ? T.valableEncore(jours, dateCourte(fin)) : null,
      };
    }
    case 'refusee':
      return { libelle: T.refusee(dateCourte(maj)), ton: 'non', explication: o.motif_refus };
    case 'retiree':
      return { libelle: T.retiree, ton: 'neutre', explication: null };
    case 'expiree':
      return { libelle: T.expiree, ton: 'neutre', explication: null };
  }
}

function base(
  genre: Genre,
  id: string,
  annonce: Annonce,
  groupe: Groupe,
  date: number,
): Pick<
  Demarche,
  | 'cle'
  | 'id'
  | 'genre'
  | 'annonce'
  | 'groupe'
  | 'date'
  | 'photo'
  | 'peutReprogrammer'
  | 'peutAnnuler'
  | 'peutRetirer'
> {
  return {
    cle: `${genre}-${id}`,
    id,
    genre,
    annonce,
    groupe,
    date,
    photo: premierePhoto(annonce),
    peutReprogrammer: false,
    peutAnnuler: false,
    peutRetirer: false,
  };
}

function nomDe(p: { prenom: string; nom: string } | null | undefined): string | null {
  return p ? `${p.prenom} ${p.nom}` : null;
}

export function premierePhoto(a: Annonce): string | null {
  return (
    [...(a.bien.medias ?? [])]
      .filter((m) => m.type === 'photo')
      .sort((x, y) => x.ordre - y.ordre)[0]?.lien ?? null
  );
}

function articleSigner(d: Demarche): string {
  return d.genre === 'offre' ? 'une offre' : 'un bail';
}
