/*
  Notifications en registre : regroupées par jour, et pour chacune le lien utile
  (contrats, messages, paiements, démarches) déduit de son titre, ou le lien écrit dans le texte.
*/
import { Notification } from '../../core/modeles/notifications';
import { Role } from '../../core/session/session';
import { GroupeJour, grouperParJour, heure } from '../messages/jours';
import { TEXTES_NOTIFICATIONS } from './textes';

const T = TEXTES_NOTIFICATIONS;
/** Adresse web écrite dans le texte, sans la ponctuation qui la suit. */
const ADRESSE_WEB = /https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)»]/;

export interface LienNotification {
  chemin: string;
  libelle: string;
  externe: boolean;
}

export interface LigneNotification {
  id: string;
  titre: string;
  contenu: string;
  heure: string;
  lue: boolean;
  lien: LienNotification | null;
}

interface Regle {
  motif: RegExp;
  chemin: string;
  libelle: string;
  roles?: readonly Role[];
}

/** Titres posés par le backend (Compte::notifier), du plus précis au plus large. */
const REGLES: readonly Regle[] = [
  { motif: /message/i, chemin: '/messages', libelle: T.liens.messages },
  {
    motif: /contrat|bail|promesse|état des lieux/i,
    chemin: '/contrats',
    libelle: T.liens.contrats,
  },
  { motif: /paiement|retrait|reçu/i, chemin: '/paiements', libelle: T.liens.paiements },
  {
    motif: /visite|demande de location|offre d'achat/i,
    chemin: '/espace',
    libelle: T.liens.demarches,
    roles: ['client'],
  },
];

export function lienNotification(
  n: Pick<Notification, 'titre' | 'contenu'>,
  role: Role | null,
): LienNotification | null {
  const adresse = n.contenu.match(ADRESSE_WEB)?.[0];
  if (adresse) return { chemin: adresse, libelle: T.liens.externe, externe: true };
  const regle = REGLES.find(
    (r) => r.motif.test(n.titre) && (!r.roles || (role !== null && r.roles.includes(role))),
  );
  return regle ? { chemin: regle.chemin, libelle: regle.libelle, externe: false } : null;
}

/** Les plus récentes d'abord, par jour : Aujourd'hui, Hier, puis la date. */
export function grouperNotifications(
  notifications: readonly Notification[],
  luesIci: ReadonlySet<string>,
  role: Role | null,
  maintenant: Date,
): GroupeJour<LigneNotification>[] {
  const recentes = [...notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return grouperParJour(recentes, (n) => new Date(n.created_at), maintenant).map((g) => ({
    ...g,
    elements: g.elements.map((n) => ({
      id: n.id,
      titre: n.titre,
      contenu: n.contenu,
      heure: heure(new Date(n.created_at)),
      lue: n.lue_le !== null || luesIci.has(n.id),
      lien: lienNotification(n, role),
    })),
  }));
}
