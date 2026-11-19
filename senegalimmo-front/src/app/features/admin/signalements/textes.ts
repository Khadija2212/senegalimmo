import { MotifSignalement } from '../../../core/services/demarches';
import { StatutSignalement } from '../../../core/modeles/admin';

export const TEXTES_SIGNALEMENTS = {
  titre: 'Signalements',
  intro:
    "Les plus anciens en premier. Traiter un signalement prévient son auteur et le propriétaire de l'annonce.",
  filtre: 'Statut des signalements',
  filtres: [
    { valeur: 'ouvert', libelle: 'Ouverts' },
    { valeur: 'en_cours', libelle: 'En cours' },
    { valeur: 'resolu', libelle: 'Résolus' },
    { valeur: 'rejete', libelle: 'Rejetés' },
  ],
  motifs: {
    annonce_frauduleuse: 'Annonce frauduleuse',
    informations_erronees: 'Informations erronées',
    bien_indisponible: 'Bien indisponible',
    comportement_abusif: 'Comportement abusif',
    probleme_paiement: 'Problème de paiement',
    autre: 'Autre motif',
  } satisfies Record<MotifSignalement, string>,
  statuts: {
    ouvert: 'Ouvert',
    en_cours: 'En cours',
    resolu: 'Résolu',
    rejete: 'Rejeté',
  } satisfies Record<StatutSignalement, string>,
  annonceSupprimee: 'Annonce supprimée',
  par: (nom: string, date: string) => `Signalé par ${nom} le ${date}`,
  auteurInconnu: 'un client',
  traiteLe: (date: string) => `le ${date}`,
  resolution: 'Résolution',

  traiter: 'Traiter',
  labelResolution: 'Résolution envoyée aux parties',
  placeholderResolution:
    "Ce que vous avez constaté et la suite donnée, par exemple l'annonce suspendue.",
  envoyer: 'Traiter et prévenir les parties',
  fermer: 'Fermer sans traiter',

  videTitre: 'Aucun signalement dans cette liste',
  videTexte: 'Les signalements envoyés par les clients depuis une annonce arrivent ici.',
  voirResolus: 'Voir les signalements résolus',
} as const;
