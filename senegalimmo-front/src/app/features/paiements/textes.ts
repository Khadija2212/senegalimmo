export const TEXTES_PAIEMENTS = {
  titre: 'Paiements',
  retourEspace: 'Retour à mon espace',
  introClient: 'Vos loyers, cautions et indemnités, avec leurs reçus.',
  introProprietaire: 'Les sommes versées par vos locataires et acheteurs, avec leurs reçus.',

  aPayer: 'À payer',
  aPayerIntro: 'Les sommes dues sur vos baux et promesses de vente signés.',
  rienAPayer: 'Rien à payer pour le moment.',
  quoiPayer: 'Que souhaitez-vous payer ?',
  loyerDe: (mois: string) => `Loyer de ${mois}`,
  caution: 'Caution',
  indemnite: 'Indemnité d’immobilisation',
  echeanceLe: (date: string) => `échéance le ${date}`,
  methode: 'Moyen de paiement',
  payer: (montant: string) => `Payer ${montant}`,
  ouverture: 'Ouverture du paiement…',
  redirection:
    'Vous allez être redirigé vers la page sécurisée du prestataire, puis ramené ici une fois le paiement fait.',

  methodes: {
    wave: 'Wave',
    orange_money: 'Orange Money',
    free_money: 'Free Money',
    carte_bancaire: 'Carte bancaire',
  },

  historique: 'Historique',
  registre: 'Historique des paiements',
  verseA: (nom: string) => `Versé à ${nom}`,
  verseePar: (nom: string) => `Versé par ${nom}`,
  netRecu: (montant: string) => `${montant} reçus après commission`,
  reussi: 'Payé',
  enAttente: 'En cours',
  echoue: 'Échoué',
  rembourse: 'Remboursé',
  le: (date: string) => `le ${date}`,
  telechargerQuittance: 'Télécharger la quittance',
  telechargerRecu: 'Télécharger le reçu',
  ouvertureDocument: 'Ouverture…',

  videTitre: 'Aucun paiement pour l’instant',
  videClient:
    'Une fois votre bail ou votre promesse de vente signé, vous payez ici la caution, les loyers ou l’indemnité, et vous retrouvez vos reçus.',
  videProprietaire:
    'Les loyers, cautions et indemnités versés pour vos biens apparaîtront ici dès le premier paiement.',
  voirContrats: 'Voir mes contrats',

  chargement: 'Chargement des paiements',
  erreurTitre: 'Les paiements ne se chargent pas',
  erreurTexte: 'Le serveur ne répond pas. Vérifiez votre connexion et réessayez.',
  reessayer: 'Réessayer',
  erreurAction: 'L’action n’a pas abouti. Réessayez dans un instant.',

  retourTitre: 'Votre paiement',
  retourVerification: 'Nous vérifions votre paiement auprès du prestataire…',
  retourReussi: 'Paiement réussi',
  retourReussiTexte: (montant: string, libelle: string) =>
    `${montant} réglés pour : ${libelle}. Le reçu est prêt.`,
  retourEnCours: 'Paiement en cours',
  retourEnCoursTexte:
    'Le prestataire n’a pas encore confirmé. La page se met à jour toute seule pendant quelques secondes.',
  retourLong: 'Toujours en attente de confirmation',
  retourLongTexte:
    'La confirmation peut prendre quelques minutes. Vous recevrez une notification dès qu’elle arrive ; le paiement apparaîtra alors dans votre historique.',
  retourEchoue: 'Paiement échoué',
  retourEchoueTexte: 'Aucune somme n’a été prélevée. Vous pouvez recommencer.',
  retourRembourse: 'Paiement remboursé',
  retourRembourseTexte: 'Cette somme vous a été remboursée.',
  retourSansReference: 'Aucun paiement à afficher',
  retourSansReferenceTexte: 'Cette page s’ouvre au retour du prestataire de paiement.',
  verifierEncore: 'Vérifier à nouveau',
  recommencer: 'Recommencer le paiement',
  voirContrat: 'Voir le contrat',
  voirPaiements: 'Voir mes paiements',
  reference: (r: string) => `Référence ${r}`,
} as const;

export const LIENS_PAIEMENTS = {
  paiements: '/paiements',
  contrats: '/contrats',
} as const;
