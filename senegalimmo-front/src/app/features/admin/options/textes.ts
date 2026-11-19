export const TEXTES_OPTIONS = {
  titre: 'Options premium',
  intro:
    'Les options que les propriétaires achètent pour mettre une annonce en avant. Une option désactivée ne se vend plus.',
  creer: 'Créer une option',
  duree: (jours: number) => (jours > 1 ? `${jours} jours` : '1 jour'),
  active: 'Active',
  desactivee: 'Désactivée',
  enVente: 'proposée aux propriétaires',
  horsVente: 'plus proposée',
  modifier: 'Modifier',
  activer: 'Activer',
  desactiver: 'Désactiver',

  nouvelle: 'Nouvelle option',
  modification: (libelle: string) => `Modifier « ${libelle} »`,
  labelLibelle: 'Libellé',
  placeholderLibelle: 'Par exemple : Mise en avant 30 jours',
  labelDuree: 'Durée, en jours',
  labelPrix: 'Prix, en FCFA',
  dureeInvalide: (max: number) => `La durée va de 1 à ${max} jours.`,
  enregistrer: 'Enregistrer',
  creerOption: "Créer l'option",
  fermer: 'Fermer',

  videTitre: 'Aucune option premium',
  videTexte:
    'Créez une première option pour que les propriétaires puissent mettre leurs annonces en avant.',
} as const;
