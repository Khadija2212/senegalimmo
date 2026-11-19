export const TEXTES_NOTIFICATIONS = {
  titre: 'Notifications',
  nonLues: (n: number) => (n > 1 ? `${n} notifications non lues.` : '1 notification non lue.'),
  toutLu: 'Tout est lu.',
  nouveau: 'Nouveau',
  marquerLue: 'Marquer comme lue',
  toutMarquer: 'Tout marquer comme lu',
  plusAnciennes: 'Afficher les plus anciennes',
  chargementSuite: 'Chargement',

  liens: {
    messages: 'Lire les messages',
    contrats: 'Voir les contrats',
    paiements: 'Voir les paiements',
    demarches: 'Voir mes démarches',
    externe: 'Ouvrir le lien',
  },

  videTitre: 'Aucune notification',
  videTexte:
    'Vous serez prévenu ici des réponses à vos démarches, des messages reçus, des contrats à signer et des paiements.',
  retourEspace: 'Retour à mon espace',

  chargement: 'Chargement des notifications',
  erreurTitre: 'Vos notifications ne se chargent pas',
  erreurTexte: 'Le serveur ne répond pas. Vérifiez votre connexion et réessayez.',
  reessayer: 'Réessayer',
  erreurAction: "L'action n'a pas abouti. Réessayez dans un instant.",
} as const;
