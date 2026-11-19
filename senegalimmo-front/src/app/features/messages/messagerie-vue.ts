/*
  Mise en forme de la messagerie, sans Angular : la ligne d'une conversation dans la liste,
  le fil groupé par jour, et la conversation déjà ouverte avec une personne pour une annonce.
*/
import { AnnonceDetaillee, Personne } from '../../core/modeles/annonce';
import { Conversation, Message, Participant } from '../../core/modeles/messagerie';
import { GroupeJour, grouperParJour, heure, repereCourt } from './jours';
import { TEXTES_MESSAGES } from './textes';

const T = TEXTES_MESSAGES;
/** Longueur d'extrait qui tient sur une ligne de la liste. */
const LONGUEUR_EXTRAIT = 90;
const POINTS = '…';

export interface LigneConversation {
  id: string;
  nom: string;
  /** Rôle de la personne et bien concerné : « Propriétaire, Villa à Ngor ». */
  contexte: string;
  extrait: string;
  quand: string;
  nonLus: number;
}

export interface BulleMessage {
  id: string;
  contenu: string;
  heure: string;
  aMoi: boolean;
  pieceJointe: string | null;
}

/** En-tête du fil : à qui l'on parle, et de quel bien. */
export interface EnteteFil {
  nom: string;
  role: string;
  bien: string | null;
  annonceId: string | null;
}

export function autreParticipant(c: Conversation, moiId: string): Participant | null {
  return c.participants.find((p) => p.id !== moiId) ?? null;
}

export function nomComplet(p: Pick<Personne, 'prenom' | 'nom'> | null): string {
  const nom = p ? `${p.prenom} ${p.nom}`.trim() : '';
  return nom || T.sansNom;
}

export function libelleRole(p: Pick<Participant, 'role'> | null): string {
  return p ? T.roles[p.role] : '';
}

export function extrait(texte: string, longueur = LONGUEUR_EXTRAIT): string {
  const net = texte.replace(/\s+/g, ' ').trim();
  return net.length > longueur ? `${net.slice(0, longueur - 1).trimEnd()}${POINTS}` : net;
}

export function versLigne(
  c: Conversation,
  moiId: string,
  maintenant: Date,
  ouverte: string | null = null,
): LigneConversation {
  const autre = autreParticipant(c, moiId);
  const dernier = c.dernier_message ?? null;
  const date = c.dernier_message_le ?? c.created_at;
  return {
    id: c.id,
    nom: nomComplet(autre),
    contexte: [libelleRole(autre), c.annonce?.bien?.titre ?? T.sansBien].filter(Boolean).join(', '),
    extrait: dernier
      ? `${dernier.expediteur_id === moiId ? `${T.moi} : ` : ''}${extrait(dernier.contenu)}`
      : '',
    quand: date ? repereCourt(new Date(date), maintenant) : '',
    nonLus: c.id === ouverte ? 0 : c.non_lus,
  };
}

/** La conversation déjà ouverte avec cette personne, pour cette annonce (ou sans annonce). */
export function trouverConversation(
  conversations: readonly Conversation[],
  destinataireId: string,
  annonceId: string | null,
): Conversation | null {
  return (
    conversations.find(
      (c) =>
        (c.annonce_id ?? null) === annonceId && c.participants.some((p) => p.id === destinataireId),
    ) ?? null
  );
}

/** Messages reçus du plus récent au plus ancien, rendus du plus ancien au plus récent, par jour. */
export function grouperMessages(
  messages: readonly Message[],
  moiId: string,
  maintenant: Date,
): GroupeJour<BulleMessage>[] {
  const chronologique = [...messages].sort(
    (a, b) => new Date(a.envoye_le).getTime() - new Date(b.envoye_le).getTime(),
  );
  const groupes = grouperParJour(chronologique, (m) => new Date(m.envoye_le), maintenant);
  return groupes.map((g) => ({
    ...g,
    elements: g.elements.map((m) => ({
      id: m.id,
      contenu: m.contenu,
      heure: heure(new Date(m.envoye_le)),
      aMoi: m.expediteur_id === moiId,
      pieceJointe: m.piece_jointe_url,
    })),
  }));
}

export function totalNonLus(conversations: readonly Conversation[]): number {
  return conversations.reduce((n, c) => n + c.non_lus, 0);
}

export function enteteConversation(c: Conversation, moiId: string): EnteteFil {
  const autre = autreParticipant(c, moiId);
  return {
    nom: nomComplet(autre),
    role: libelleRole(autre),
    bien: c.annonce?.bien?.titre ?? null,
    annonceId: c.annonce_id,
  };
}

/** Nouvelle conversation : l'annonce donne le bien et le nom du propriétaire ou de l'agent. */
export function enteteBrouillon(
  annonce: AnnonceDetaillee | undefined,
  destinataireId: string,
): EnteteFil {
  const proprietaire = annonce?.bien.proprietaire ?? null;
  const agent = annonce?.agent ?? null;
  const personne =
    proprietaire?.id === destinataireId
      ? { p: proprietaire, role: T.roles.proprietaire }
      : agent?.id === destinataireId
        ? { p: agent, role: T.roles.agent }
        : null;
  return {
    nom: personne ? nomComplet(personne.p) : T.nouvelleConversation,
    role: personne?.role ?? '',
    bien: annonce?.bien.titre ?? null,
    annonceId: annonce?.id ?? null,
  };
}
