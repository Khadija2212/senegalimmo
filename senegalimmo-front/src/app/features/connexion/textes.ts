import { RoleInscription } from '../../core/session/session';
import { NomIcone } from '../../shared/icones/icones';

export type OngletConnexion = 'connexion' | 'inscription';

export const TEXTES_CONNEXION = {
  titreConnexion: 'Bon retour parmi nous',
  titreEtape: 'Encore une étape',
  chapeauConnexion: 'Retrouvez vos visites, vos demandes et vos contrats.',
  titreInscription: 'Créer votre compte',
  chapeauInscription: 'Deux minutes suffisent. Vous pourrez compléter votre profil plus tard.',
  ongletConnexion: 'Se connecter',
  ongletInscription: 'Créer un compte',
  retourAccueil: "Retour à l'accueil",
  retourAnnonce: "Retour à l'annonce",
  contexte: (action: string) =>
    `Connectez-vous pour ${action}. Vous reviendrez ensuite sur l'annonce, avec ce que vous aviez déjà choisi.`,

  promesseTitre: 'Un seul compte pour visiter, signer et payer.',
  promessePhoto: 'Appartement vérifié, Sacré-Cœur',
  pourquoi: 'Pourquoi un compte',

  email: 'Adresse e-mail',
  motDePasse: 'Mot de passe',
  confirmation: 'Confirmation',
  afficher: 'Afficher',
  masquer: 'Masquer',
  seConnecter: 'Se connecter',
  connexionEnCours: 'Connexion...',
  pasDeCompte: 'Pas encore de compte ?',
  creerCompte: 'Créer un compte',

  vousVenezPour: 'Vous venez pour',
  prenom: 'Prénom',
  nom: 'Nom',
  telephone: 'Téléphone',
  indicatif: '+221',
  aideTelephone: 'Pour que la personne qui gère le bien puisse confirmer une visite.',
  aideMotDePasse: '8 caractères au moins.',
  creerMonCompte: 'Créer mon compte',
  creationEnCours: 'Création du compte...',
  dejaInscrit: 'Déjà inscrit ?',

  securite:
    'Votre session est gardée dans un cookie protégé, illisible par les scripts de la page. Après 10 essais en une minute, la connexion est suspendue un instant.',

  requis: 'Ce champ est obligatoire.',
  emailInvalide: 'Cette adresse e-mail ne semble pas valide.',
  telephoneInvalide: 'Entrez un numéro de 9 chiffres, par exemple 77 123 45 67.',
  motDePasseCourt: 'Le mot de passe doit faire 8 caractères au moins.',
  confirmationDifferente: 'Les deux mots de passe sont différents.',
  emailDejaPris: 'Un compte existe déjà avec cette adresse.',
  tropDEssais: 'Trop d’essais en peu de temps. Attendez une minute avant de réessayer.',
  erreurServeur: 'Le serveur ne répond pas. Vérifiez votre connexion et réessayez.',
  identifiantsIncorrects:
    'Adresse e-mail ou mot de passe incorrect. Vérifiez les deux et réessayez.',
} as const;

export interface ProfilInscription {
  role: RoleInscription;
  icone: NomIcone;
  titre: string;
  texte: string;
  note: string | null;
}

export const PROFILS: readonly ProfilInscription[] = [
  {
    role: 'client',
    icone: 'siCle',
    titre: 'Trouver un logement',
    texte: 'Louer ou acheter, demander des visites, signer et payer en ligne.',
    note: null,
  },
  {
    role: 'proprietaire',
    icone: 'siVilla',
    titre: 'Louer ou vendre mon bien',
    texte: 'Publier des annonces, choisir les locataires, encaisser les loyers.',
    note: "Pour obtenir le badge vérifié sur vos annonces, vous ajouterez ensuite votre pièce d'identité depuis votre profil.",
  },
  {
    role: 'agent',
    icone: 'siContrat',
    titre: "Gérer des biens pour d'autres",
    texte: 'Agent immobilier mandaté par des propriétaires.',
    note: "Votre compte agent sera validé par l'équipe avant que vous puissiez gérer des biens. Gardez votre carte professionnelle à portée de main.",
  },
];

export const GARANTIES: readonly { icone: NomIcone; titre: string; texte: string }[] = [
  {
    icone: 'siSceau',
    titre: 'Des annonces contrôlées',
    texte: "L'équipe vérifie le bien et l'identité du propriétaire avant d'attribuer le badge.",
  },
  {
    icone: 'siContrat',
    titre: 'Des contrats signés en ligne',
    texte: 'Bail, mandat ou promesse de vente, avec un état des lieux validé par les deux parties.',
  },
  {
    icone: 'siMobile',
    titre: 'Des paiements tracés',
    texte: 'Wave, Orange Money, Free Money ou carte, avec un reçu pour chaque versement.',
  },
];
