export type RubriqueAgent = 'visites' | 'demandes' | 'biens' | 'mandats' | 'performances';

export const TEXTES_AGENT = {
  bonjour: (prenom: string) => `Bonjour ${prenom}`,
  enBref: 'En bref',
  biensAssignes: 'biens assignés',
  aConfirmer: 'à confirmer',
  confirmees: 'confirmées',
  conversion: 'conversion',
  rubriques: 'Rubriques de mon espace agent',
  rubriqueVisites: 'Visites',
  rubriqueDemandes: 'Demandes clients',
  rubriqueBiens: 'Biens assignés',
  rubriqueMandats: 'Mandats',
  rubriquePerformances: 'Performances',
  portefeuille: 'Portefeuille',
  messages: 'Messages',
  nonLus: (n: number) => `${n} non lus`,
  contrats: 'Contrats',
  profil: 'Profil',

  rienEnAttente: "Rien n'attend votre réponse pour le moment.",
  visitesAConfirmer: (n: number) =>
    n > 1 ? `${n} visites attendent votre confirmation` : 'une visite attend votre confirmation',
  comptesRendus: (n: number) =>
    n > 1 ? `${n} comptes rendus sont à rédiger` : 'un compte rendu est à rédiger',
  demandesAttente: (n: number) =>
    n > 1
      ? `${n} demandes de clients attendent une réponse`
      : 'une demande de client attend une réponse',

  attenteTitre: 'Votre compte agent attend la validation',
  attenteTexte:
    "L'équipe SénégalImmo vérifie votre dossier. Vous serez prévenu par notification dès que votre compte est validé ; les propriétaires pourront alors vous confier leurs biens.",
  refuseTitre: "Votre compte agent n'a pas été validé",
  refuseTexte:
    "L'équipe SénégalImmo n'a pas pu valider votre compte. Écrivez au support pour connaître la raison et compléter votre dossier.",

  aVenir: 'À venir',
  aVenirIntro: 'Confirmez ou refusez les visites demandées ; le client est prévenu aussitôt.',
  sansCompteRendu: 'Passées sans compte rendu',
  sansCompteRenduIntro:
    'La visite a eu lieu : notez ce que le client en a pensé. Le compte rendu reste entre vous et le propriétaire.',
  historique: 'Historique',
  exporterPlanning: 'Exporter mon planning',
  exportEnCours: 'Préparation du planning...',
  notePlanning: 'Les visites confirmées des 30 prochains jours, à importer dans votre agenda.',
  erreurPlanning: "Le planning n'a pas pu être exporté. Réessayez dans un instant.",
  visitesVides: 'Aucune visite pour le moment',
  visitesVidesTexte:
    'Quand un client demande à visiter un de vos biens assignés, la demande arrive ici pour que vous la confirmiez.',
  voirBiens: 'Voir mes biens assignés',

  genreVisite: 'Visite',
  genreLocation: 'Demande de location',
  genreOffre: "Offre d'achat",
  par: (nom: string, telephone: string | null) =>
    telephone ? `, demandée par ${nom}, ${telephone}` : `, demandée par ${nom}`,
  client: (nom: string, telephone: string | null) => (telephone ? `${nom}, ${telephone}` : nom),
  aConfirmerEtat: 'À confirmer',
  aConfirmerExplication: 'le client attend votre réponse',
  confirmeeEtat: 'Confirmée',
  confirmeeExplication: 'le client est attendu sur place',
  rediger: 'Compte rendu à rédiger',
  redigerExplication: 'la visite a eu lieu',
  effectuee: 'Effectuée',
  interet: (niveau: string) => `intérêt du client ${niveau}`,
  refusee: 'Refusée',
  annulee: 'Annulée',
  sansReponse: 'Date passée sans réponse',

  confirmer: 'Confirmer la visite',
  refuser: 'Refuser',
  reprogrammer: 'Reprogrammer',
  redigerCompteRendu: 'Rédiger le compte rendu',
  ecrireClient: 'Écrire au client',
  motifRefus: 'Motif du refus, transmis au client',
  placeholderMotif: 'Par exemple : le bien est déjà réservé ce jour-là.',
  ouiRefuser: 'Refuser la visite',
  nonGarder: 'Annuler',
  nouvelleDate: 'Nouvelle date et heure',
  proposerDate: 'Proposer cette date',
  noteReprog: 'La visite repasse à confirmer : le client est prévenu du nouveau créneau.',
  contenuCompteRendu: 'Déroulement de la visite',
  placeholderCompteRendu: 'Questions posées, points forts et réserves du client, suite envisagée.',
  interetClient: 'Intérêt du client',
  enregistrerCompteRendu: 'Enregistrer le compte rendu',
  niveaux: { faible: 'Faible', moyen: 'Moyen', fort: 'Fort' },

  demandesIntro: 'Demandes de location et offres d’achat reçues sur les biens que vous gérez.',
  enAttente: 'En attente de votre réponse',
  traitees: 'Traitées',
  entreeLe: (date: string, mois: number) => `Entrée le ${date}, bail de ${mois} mois`,
  offreDe: (montant: string) => `Offre de ${montant}`,
  ecartPrix: (pourcent: number) =>
    pourcent > 0 ? `, soit ${pourcent} % sous le prix demandé` : '',
  attenteEtat: 'En attente',
  recueLe: (date: string) => `reçue le ${date}`,
  acceptee: 'Acceptée',
  bailPrepare: 'le propriétaire prépare le bail',
  retiree: 'Retirée',
  expiree: 'Expirée',
  accepterDemande: 'Accepter la demande',
  refuserDemande: 'Refuser la demande',
  refuserOffre: "Refuser l'offre",
  placeholderMotifDemande:
    'Par exemple : le dossier ne correspond pas aux conditions du propriétaire.',
  noteOffre: "Seul le propriétaire peut accepter une offre d'achat.",
  confirmerAcceptation: (nom: string) =>
    `Accepter la demande de ${nom} ? Le client est prévenu et le propriétaire prépare ensuite le bail.`,
  ouiAccepter: 'Oui, accepter',
  demandesVides: 'Aucune demande de client',
  demandesVidesTexte:
    'Les demandes de location et les offres d’achat sur vos biens assignés apparaîtront ici.',

  biensIntro: 'Les biens que des propriétaires vous ont confiés par un mandat en cours.',
  filtreStatut: 'Filtrer par statut',
  tous: 'Tous',
  statutsBien: {
    brouillon: 'Brouillon',
    disponible: 'Disponible',
    sous_offre: 'Sous offre',
    loue: 'Loué',
    vendu: 'Vendu',
    retire: 'Retiré',
  },
  proprietaireDe: (nom: string) => `Propriétaire : ${nom}`,
  annonceEnModeration: 'annonce en modération',
  annonceEnLigne: 'annonce en ligne',
  annonceSuspendue: 'annonce suspendue',
  sansAnnonce: 'sans annonce',
  publierAnnonce: 'Publier une annonce',
  voirAnnonce: "Voir l'annonce",
  biensVides: 'Aucun bien assigné',
  biensVidesTexte:
    "Quand un propriétaire vous confie un bien par mandat et que vous l'avez signé, il apparaît ici.",
  voirMandats: 'Voir mes mandats',
  aucunBienStatut: 'Aucun bien avec ce statut.',

  typeTransaction: 'Type de transaction',
  location: 'Location',
  vente: 'Vente',
  prixLocation: 'Loyer mensuel (FCFA)',
  prixVente: 'Prix de vente (FCFA)',
  charges: 'Charges mensuelles (FCFA)',
  caution: 'Caution (FCFA)',
  envoyerModeration: "Envoyer l'annonce en modération",
  fermer: 'Fermer',
  noteAnnonce:
    "L'annonce reprend les photos et la position du bien. Elle est en ligne dès qu'un modérateur l'a validée.",

  mandatsIntro: 'Les contrats par lesquels les propriétaires vous confient leurs biens.',
  typesMandat: { simple: 'Mandat simple', exclusif: 'Mandat exclusif' },
  commission: (taux: string) => `Commission de ${taux} %`,
  finLe: (date: string) => `, jusqu'au ${date}`,
  enCours: 'En cours',
  enSignature: 'En signature',
  enSignatureExplication: 'votre signature ou celle du propriétaire est attendue',
  brouillon: 'Brouillon',
  expire: 'Expiré',
  resilie: 'Résilié',
  finProche: (jours: number) =>
    jours > 1
      ? `se termine dans ${jours} jours`
      : jours === 1
        ? 'se termine demain'
        : "se termine aujourd'hui",
  signer: 'Signer le mandat',
  renouveler: 'Renouveler',
  resilier: 'Résilier',
  dureeMois: 'Durée du renouvellement, en mois',
  renouvelerPour: (mois: number) => `Renouveler pour ${mois} mois`,
  motifResiliation: 'Motif de la résiliation, transmis au propriétaire',
  placeholderResiliation: 'Par exemple : le propriétaire reprend la gestion de son bien.',
  confirmerResiliation: (titre: string) =>
    `Résilier le mandat de « ${titre} » ? Vous ne gérerez plus ce bien et la décision est définitive.`,
  ouiResilier: 'Oui, résilier le mandat',
  nonGarderMandat: 'Non, le garder',
  mandatsVides: 'Aucun mandat',
  mandatsVidesTexte:
    'Un propriétaire vous mandate depuis son espace ; le mandat arrive ici et dans vos contrats pour être signé.',

  performancesIntro: 'Vos résultats sur les biens que vous gérez, mis à jour à chaque visite.',
  tauxConversion: 'Taux de conversion',
  tauxExplication: 'visites effectuées qui ont abouti à un bail ou une promesse signée',
  visitesConfirmeesLong: 'Visites confirmées',
  visitesAConfirmerLong: 'Visites à confirmer',
  biensAssignesLong: 'Biens assignés',
  mandatsEnSignature: 'Mandats en signature',
  soldeDisponible: 'Solde disponible',
  voirPortefeuille: 'Voir le portefeuille',

  chargement: 'Chargement de votre espace',
  erreurTitre: 'Votre espace ne se charge pas',
  erreurTexte: 'Le serveur ne répond pas. Vérifiez votre connexion et réessayez.',
  reessayer: 'Réessayer',
  erreurAction: "L'action n'a pas abouti. Réessayez dans un instant.",
  envoiEnCours: 'Envoi...',
} as const;

export const LIENS_AGENT = {
  portefeuille: '/portefeuille',
  messages: '/messages',
  contrats: '/contrats',
  profil: '/profil',
  annonce: '/annonces',
} as const;
