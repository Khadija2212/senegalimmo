import { MethodeRetrait } from '../../core/modeles/portefeuille';

export const TEXTES_PORTEFEUILLE = {
  titre: 'Portefeuille',
  intro:
    'Les loyers, ventes et commissions encaissés pour vous, et vos retraits vers Wave, Orange Money ou Free Money.',
  retour: 'Retour à mon espace',
  disponible: 'Solde disponible',
  disponibleNote: 'Vous pouvez le retirer dès maintenant.',
  enAttente: 'En attente',
  enAttenteNote: 'Bloqué le temps du traitement de vos retraits.',
  misAJour: (date: string) => `Mis à jour le ${date}.`,

  demanderRetrait: 'Demander un retrait',
  montant: 'Montant, en FCFA',
  montantNote: (minimum: string, maximum: string) => `Entre ${minimum} et ${maximum}.`,
  methode: 'Vers',
  numero: 'Numéro du compte bénéficiaire',
  numeroPlaceholder: '77 123 45 67',
  envoyer: 'Demander le retrait',
  envoiEnCours: 'Envoi en cours',
  retraitDemande: (montant: string) =>
    `Retrait de ${montant} demandé. Le montant est bloqué jusqu'à sa validation par l'équipe.`,
  soldeInsuffisant: (minimum: string) =>
    `Il faut au moins ${minimum} disponibles pour demander un retrait.`,
  requis: 'Ce champ est obligatoire.',
  montantTropPetit: (minimum: string) => `Le minimum est de ${minimum}.`,
  montantTropGrand: 'Le montant dépasse votre solde disponible.',
  montantEntier: 'Indiquez un montant entier, sans virgule.',
  numeroInvalide: 'Le numéro doit contenir 7 à 20 chiffres.',
  erreurRetrait: "Le retrait n'a pas pu être demandé. Réessayez dans un instant.",

  retraits: 'Mes retraits',
  retraitsVides: "Aucun retrait pour l'instant.",
  retraitVers: (methode: string, numero: string) => `vers ${methode}, ${numero}`,
  demandeLe: (date: string) => `Demandé le ${date}`,
  statutDemande: 'En attente de validation',
  statutApprouve: 'Approuvé',
  approuveTexte: 'Le versement est en cours.',
  statutVerse: 'Versé',
  verseLe: (date: string) => `le ${date}`,
  statutRejete: 'Rejeté',
  rejeteTexte: 'Le montant est revenu sur votre solde.',
  motif: (motif: string) => `Motif : ${motif}`,

  mouvements: 'Mouvements',
  mouvementsIntro: 'Les 50 dernières écritures, de la plus récente à la plus ancienne.',
  mouvementsVides:
    'Aucun mouvement pour le moment. Les loyers et ventes encaissés pour vous apparaîtront ici.',
  date: 'Date',
  libelle: 'Opération',
  montantCol: 'Montant',
  soldeApres: 'Solde après',
  creditLoyer: 'Loyer encaissé',
  creditVente: 'Vente encaissée',
  commission: 'Commission',
  blocage: 'Retrait bloqué',
  debit: 'Retrait versé',
  deblocage: 'Retrait débloqué',

  chargement: 'Chargement du portefeuille',
  erreurTitre: 'Le portefeuille ne se charge pas',
  erreurTexte: 'Le serveur ne répond pas. Vérifiez votre connexion et réessayez.',
  reessayer: 'Réessayer',
} as const;

export const METHODES_RETRAIT: readonly { valeur: MethodeRetrait; libelle: string }[] = [
  { valeur: 'wave', libelle: 'Wave' },
  { valeur: 'orange_money', libelle: 'Orange Money' },
  { valeur: 'free_money', libelle: 'Free Money' },
];
