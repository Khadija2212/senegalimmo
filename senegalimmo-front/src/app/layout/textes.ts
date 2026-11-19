export const TEXTES_LAYOUT = {
  marque: 'SénégalImmo',
  accueil: 'SénégalImmo, accueil',
  navigation: 'Navigation principale',
  louer: 'Louer',
  acheter: 'Acheter',
  publier: 'Publier un bien',
  connexion: 'Se connecter',
  inscription: 'Créer un compte',
  deconnexion: 'Se déconnecter',
  ouvrirMenu: 'Ouvrir le menu',
  fermerMenu: 'Fermer le menu',
  presentation:
    'Location, vente et gestion de biens immobiliers au Sénégal. Projet de fin de cycle ISI, promotion 2025/2026.',
  chercher: 'Chercher',
  proposer: 'Proposer',
  comparer: 'Comparer des biens',
  devenirAgent: 'Devenir agent',
  conditions: "Conditions d'utilisation",
} as const;

export const LIENS = {
  louer: { chemin: '/', parametres: { transaction: 'location' } },
  acheter: { chemin: '/', parametres: { transaction: 'vente' } },
  publier: '/proprietaire/biens',
  connexion: '/connexion',
  inscription: '/inscription',
  comparer: '/comparateur',
} as const;
