import { StatutPaiement, TypePaiement } from '../../../core/modeles/admin';

export const TEXTES_TRANSACTIONS = {
  titre: 'Transactions',
  intro: 'Tous les paiements de la plateforme, les plus récents en premier.',
  filtre: 'Statut des paiements',
  filtres: [
    { valeur: '', libelle: 'Tous' },
    { valeur: 'reussi', libelle: 'Réussis' },
    { valeur: 'en_attente', libelle: 'En attente' },
    { valeur: 'echoue', libelle: 'Échoués' },
    { valeur: 'rembourse', libelle: 'Remboursés' },
  ],
  du: 'Du',
  au: 'Au',
  effacerDates: 'Toute la période',
  sommes: 'Sommes sur la période',
  totalEncaisse: 'encaissés',
  commissions: 'de commissions',
  noteSommes: 'Paiements réussis seulement.',
  statuts: {
    en_attente: 'En attente',
    reussi: 'Réussi',
    echoue: 'Échoué',
    rembourse: 'Remboursé',
  } satisfies Record<StatutPaiement, string>,
  types: {
    loyer: 'Loyer',
    caution: 'Caution',
    indemnite: "Indemnité d'immobilisation",
  } satisfies Record<TypePaiement, string>,
  methodes: {
    wave: 'Wave',
    orange_money: 'Orange Money',
    free_money: 'Free Money',
    carte_bancaire: 'Carte bancaire',
  },
  detail: (reference: string, methode: string, date: string) =>
    `${reference}, ${methode}, le ${date}`,
  commission: (montant: string) => `dont ${montant} de commission`,

  videTitre: 'Aucun paiement sur cette période',
  videTexte: 'Élargissez la période ou retirez le filtre de statut.',
} as const;
