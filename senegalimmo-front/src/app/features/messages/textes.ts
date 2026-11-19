export const TEXTES_MESSAGES = {
  titre: 'Messages',
  resume: (conversations: number, nonLus: number) =>
    `${conversations} ${conversations > 1 ? 'conversations' : 'conversation'}, ${
      nonLus === 0
        ? 'aucun message non lu'
        : `${nonLus} ${nonLus > 1 ? 'messages non lus' : 'message non lu'}`
    }.`,
  listeConversations: 'Vos conversations',
  nonLus: (n: number) => `${n} non lus`,
  sansNom: 'Utilisateur de SénégalImmo',
  sansBien: 'Sans annonce',
  roles: {
    client: 'Client',
    proprietaire: 'Propriétaire',
    agent: 'Agent',
    administrateur: 'Administrateur',
  },
  aujourdhui: "Aujourd'hui",
  hier: 'Hier',
  moi: 'Vous',

  retour: 'Retour aux conversations',
  voirAnnonce: "Voir l'annonce",
  choisir: 'Choisissez une conversation pour lire les messages.',
  nouvelleConversation: 'Nouvelle conversation',
  premierMessage:
    'Écrivez votre premier message. La conversation sera créée dès son envoi et la personne sera prévenue.',
  aPropos: (bien: string) => `À propos de « ${bien} »`,
  pieceJointe: 'Ouvrir la pièce jointe',
  filVide: 'Aucun message dans cette conversation.',
  messagesDu: (jour: string) => `Messages du ${jour}`,

  votreMessage: 'Votre message',
  ecrire: 'Écrire un message',
  aide: 'Entrée pour envoyer, Maj et Entrée pour aller à la ligne.',
  envoyer: 'Envoyer',
  envoiEnCours: 'Envoi en cours',
  erreurEnvoi: "Le message n'est pas parti. Réessayez dans un instant.",

  videTitre: "Aucune conversation pour l'instant",
  videClient:
    'Sur une annonce ou dans vos démarches, « Écrire au propriétaire » ouvre une conversation ici. Vous serez prévenu de chaque réponse.',
  videGestion:
    "Quand un client vous écrit à propos d'un de vos biens, la conversation apparaît ici. Vous pourrez lui répondre directement.",
  chercherLogement: 'Chercher un logement',
  retourEspace: 'Retour à mon espace',

  chargement: 'Chargement des conversations',
  chargementFil: 'Chargement des messages',
  erreurTitre: 'Vos messages ne se chargent pas',
  erreurTexte: 'Le serveur ne répond pas. Vérifiez votre connexion et réessayez.',
  erreurFil: 'Les messages de cette conversation ne se chargent pas.',
  reessayer: 'Réessayer',
} as const;

export const LIENS_MESSAGES = {
  messages: '/messages',
  annonce: '/annonces',
  accueil: '/',
} as const;
