import { Rubrique } from './admin-vue';

export const TEXTES_ADMIN = {
  bonjour: (prenom: string) => `Bonjour ${prenom}`,
  rienEnAttente: "Rien n'attend de décision pour le moment.",
  enBref: 'En bref',
  rubriques: "Rubriques de l'administration",
  niveaux: {
    moderateur: 'Modération',
    finance: 'Finance',
    super_admin: 'Super administrateur',
  },
  niveau: (libelle: string) => `Niveau : ${libelle}`,

  indicateurs: {
    utilisateurs: 'utilisateurs',
    annonces_a_moderer: 'à modérer',
    agents_a_valider: 'agents à valider',
    signalements_ouverts: 'signalements',
    retraits_en_attente: 'retraits',
    volume: 'FCFA encaissés',
    commissions: 'FCFA de commissions',
  },

  rubrique: {
    annonces: 'Annonces à modérer',
    comptes: 'Comptes',
    signalements: 'Signalements',
    retraits: 'Retraits',
    transactions: 'Transactions',
    commissions: 'Commissions',
    options: 'Options premium',
    notification: 'Envoyer une notification',
  } satisfies Record<Rubrique, string>,

  chargement: 'Chargement',
  erreurTitre: 'Cette rubrique ne se charge pas',
  erreurTexte: 'Le serveur ne répond pas. Vérifiez votre connexion et réessayez.',
  erreurAccueil: "L'administration ne se charge pas",
  reessayer: 'Réessayer',
  erreurAction: "L'action n'a pas abouti. Réessayez dans un instant.",
  enCours: 'Envoi en cours',

  pagination: 'Pages',
  pagePrecedente: 'Page précédente',
  pageSuivante: 'Page suivante',
  pageSur: (page: number, total: number) => `Page ${page} sur ${total}`,
  filtrer: 'Filtrer',
  tous: 'Tous',
  non: 'Non, annuler',
} as const;
