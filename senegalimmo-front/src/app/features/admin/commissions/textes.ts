export const TEXTES_COMMISSIONS = {
  titre: 'Commissions',
  intro:
    "Une nouvelle règle remplace la précédente à sa date d'effet. Les paiements déjà faits gardent leur règle.",
  types: { location: 'Location', vente: 'Vente' },
  active: 'En vigueur',
  aucuneActive: 'Aucune règle en vigueur',
  aucuneActiveTexte:
    'Les paiements de ce type ne peuvent pas être calculés tant qu’aucune règle ne s’applique.',
  taux: (taux: string) => `${taux} %`,
  minimum: (montant: string) => `, minimum ${montant}`,
  depuis: (date: string) => `depuis le ${date}`,
  aPartirDu: (date: string) => `à partir du ${date}`,
  par: (nom: string) => `, définie par ${nom}`,
  aVenir: 'À venir',
  historique: 'Règles remplacées',

  ajouter: 'Ajouter une règle',
  formulaire: 'Nouvelle règle de commission',
  typeTransaction: 'Type de transaction',
  choixTypes: [
    { valeur: 'location', libelle: 'Location' },
    { valeur: 'vente', libelle: 'Vente' },
  ],
  labelTaux: 'Taux, en %',
  labelMinimum: 'Minimum, en FCFA',
  labelDate: "Date d'effet",
  enregistrer: 'Ajouter la règle',
  fermer: 'Fermer',
  tauxInvalide: 'Le taux va de 0 à 100 %.',
} as const;
