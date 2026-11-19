import { MethodeRetrait, StatutRetrait } from '../../../core/modeles/admin';

export const TEXTES_RETRAITS = {
  titre: 'Retraits',
  intro:
    "Les demandes à valider en premier. Approuver déclenche le versement chez le prestataire ; le retrait passe à « Versé » dès qu'il le confirme.",
  filtre: 'Statut des retraits',
  filtres: [
    { valeur: 'demande', libelle: 'À valider' },
    { valeur: 'approuve', libelle: 'Approuvés' },
    { valeur: 'verse', libelle: 'Versés' },
    { valeur: 'rejete', libelle: 'Rejetés' },
    { valeur: '', libelle: 'Tous' },
  ],
  statuts: {
    demande: 'À valider',
    approuve: 'Approuvé',
    verse: 'Versé',
    rejete: 'Rejeté',
  } satisfies Record<StatutRetrait, string>,
  methodes: {
    wave: 'Wave',
    orange_money: 'Orange Money',
    free_money: 'Free Money',
    carte_bancaire: 'Carte bancaire',
  } satisfies Record<MethodeRetrait, string>,
  beneficiaireInconnu: 'Bénéficiaire inconnu',
  vers: (methode: string, numero: string) => ` sur ${methode}, au ${numero}`,
  demandeLe: (date: string) => `demandé le ${date}`,
  enVersement: 'versement en cours chez le prestataire',
  verseLe: (date: string, ref: string | null) =>
    ref ? `le ${date}, référence ${ref}` : `le ${date}`,
  rejeteMotif: (motif: string) => `motif : ${motif}`,
  par: (nom: string) => `, par ${nom}`,

  approuver: 'Approuver et verser',
  confirmerVersement: (montant: string, nom: string, methode: string) =>
    `Verser ${montant} à ${nom} sur ${methode} ? Le versement part tout de suite.`,
  ouiVerser: 'Oui, verser',
  rejeter: 'Rejeter',
  labelMotif: 'Motif du rejet, envoyé au bénéficiaire',
  placeholderMotif: 'Par exemple : numéro de téléphone invalide.',
  rejeterRetrait: 'Rejeter le retrait',
  fermer: 'Fermer',
  nonGarder: 'Non, ne rien faire',

  videTitre: 'Aucun retrait dans cette liste',
  videTexte: 'Les demandes de retrait des propriétaires et des agents arrivent ici.',
  voirTous: 'Voir tous les retraits',
} as const;
