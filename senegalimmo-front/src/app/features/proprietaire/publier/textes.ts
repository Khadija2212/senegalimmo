import { TypeBien } from '../../../core/modeles/annonce';

export const TEXTES_PUBLIER = {
  retour: 'Retour à mes biens',
  titre: 'Publier un bien',
  intro:
    "Décrivez le bien, fixez le prix et ajoutez des photos. L'annonce est vérifiée par l'équipe avant sa mise en ligne.",
  etapeBien: 'Le bien',
  etapeAnnonce: "L'annonce",
  etapePhotos: 'Les photos',
  bienEnregistre: 'Le bien est enregistré. Il reste à terminer les étapes suivantes.',

  titreBien: "Titre de l'annonce",
  titrePlaceholder: 'Par exemple : Appartement lumineux près de la corniche',
  typeBien: 'Type de bien',
  choisirType: 'Choisissez un type',
  surface: 'Surface, en m²',
  pieces: 'Pièces',
  chambres: 'Chambres',
  meuble: 'Ameublement',
  meubleOui: 'Meublé',
  meubleNon: 'Non meublé',
  adresse: 'Adresse',
  adressePlaceholder: 'Rue, numéro, repère',
  quartier: 'Quartier',
  ville: 'Ville',
  villeParDefaut: 'Dakar',
  description: 'Description',
  descriptionPlaceholder:
    'État du logement, étage, eau et électricité, sécurité, accès, ce qui le rend agréable à vivre.',

  transaction: 'Vous proposez le bien',
  location: 'À la location',
  vente: 'À la vente',
  loyer: 'Loyer mensuel, en FCFA',
  prixVente: 'Prix de vente, en FCFA',
  charges: 'Charges mensuelles, en FCFA',
  caution: 'Caution, en FCFA',
  noteCaution: 'La caution est en général d’un à trois mois de loyer.',

  photosIntro: 'Photos JPG, PNG ou WebP, 20 Mo au plus chacune. La première sert de vignette.',
  choisirPhotos: 'Ajouter des photos',
  retirer: 'Retirer',
  premiere: 'Vignette',
  aucunePhoto: 'Aucune photo pour le moment. Une annonce avec photos reçoit bien plus de visites.',
  photoRefusee: (nom: string) =>
    `« ${nom} » n'est pas une photo JPG, PNG ou WebP de 20 Mo au plus.`,

  publier: 'Publier le bien',
  envoiBien: 'Enregistrement du bien',
  envoiPhotos: 'Envoi des photos',
  envoiAnnonce: "Création de l'annonce",
  noteModeration: 'Vous serez prévenu dès que l’annonce sera en ligne.',

  requis: 'Ce champ est obligatoire.',
  tropLong: (max: number) => `${max} caractères au plus.`,
  positif: 'Indiquez un nombre supérieur à zéro.',
  entier: 'Indiquez un nombre entier.',
  pasNegatif: 'Indiquez un nombre positif ou zéro.',
  auMoinsUne: 'Au moins une pièce.',
  verifierChamps: 'Certains champs sont à corriger : ils sont signalés en rouge.',
  erreurEnvoi: "La publication n'a pas abouti. Réessayez dans un instant.",
} as const;

export const TYPES_BIEN: readonly { valeur: TypeBien; libelle: string }[] = [
  { valeur: 'appartement', libelle: 'Appartement' },
  { valeur: 'maison', libelle: 'Maison' },
  { valeur: 'villa', libelle: 'Villa' },
  { valeur: 'studio', libelle: 'Studio' },
  { valeur: 'chambre', libelle: 'Chambre' },
  { valeur: 'terrain', libelle: 'Terrain' },
  { valeur: 'bureau', libelle: 'Bureau' },
  { valeur: 'local_commercial', libelle: 'Local commercial' },
];
