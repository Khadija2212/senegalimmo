import { Role } from '../session/session';

/** Participant tel que renvoyé par GET /conversations (colonnes choisies par le contrôleur). */
export interface Participant {
  id: string;
  prenom: string;
  nom: string;
  role: Role;
  photo_url: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  expediteur_id: string;
  contenu: string;
  piece_jointe_url: string | null;
  envoye_le: string;
  lu_le: string | null;
  expediteur?: { id: string; prenom: string; nom: string };
}

export interface Conversation {
  id: string;
  annonce_id: string | null;
  dernier_message_le: string | null;
  created_at: string;
  participants: Participant[];
  annonce: { id: string; bien: { id: string; titre: string } | null } | null;
  /** Ajouté par le contrôleur : messages reçus pas encore lus. */
  non_lus: number;
  /** Présent seulement si le backend charge la relation du dernier message. */
  dernier_message?: Message | null;
}

/** Page Laravel des messages, du plus récent au plus ancien. */
export interface PageMessages {
  data: Message[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface NouvelleConversation {
  destinataire_id: string;
  annonce_id: string | null;
  contenu: string;
}

export interface ConversationCreee {
  conversation: { id: string; annonce_id: string | null };
  message: Message;
}
