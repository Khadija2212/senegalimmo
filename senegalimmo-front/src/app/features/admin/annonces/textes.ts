import { StatutAnnonce } from '../../../core/modeles/admin';

export const TEXTES_ANNONCES = {
  titre: 'Annonces à modérer',
  intro: 'Les plus anciennes en premier. Le propriétaire est prévenu de chaque décision.',
  filtre: 'Statut des annonces',
  filtres: [
    { valeur: 'en_moderation', libelle: 'En modération' },
    { valeur: 'publiee', libelle: 'Publiées' },
    { valeur: 'suspendue', libelle: 'Suspendues' },
    { valeur: 'rejetee', libelle: 'Rejetées' },
  ],
  statuts: {
    en_moderation: 'En modération',
    publiee: 'Publiée',
    suspendue: 'Suspendue',
    rejetee: 'Rejetée',
    louee: 'Louée',
    vendue: 'Vendue',
    expiree: 'Expirée',
  } satisfies Record<StatutAnnonce, string>,
  location: 'Location',
  vente: 'Vente',
  parMois: ' par mois',
  par: (prenom: string, nom: string) => `${prenom} ${nom}`,
  proprietaireInconnu: 'Propriétaire inconnu',
  identiteVerifiee: 'identité vérifiée',
  identiteNonVerifiee: 'identité non vérifiée',
  depuis: (date: string) => `déposée ou modifiée le ${date}`,
  badgeAttribue: 'Badge vérifié attribué',
  badgeImpossible: "Le badge attend la vérification de l'identité du propriétaire.",

  approuver: 'Approuver',
  republier: 'Publier de nouveau',
  rejeter: 'Rejeter',
  suspendre: 'Suspendre',
  attribuerBadge: 'Attribuer le badge vérifié',
  confirmerRejet:
    'Rejeter cette annonce ? Elle ne sera pas publiée et le propriétaire sera prévenu.',
  ouiRejeter: "Oui, rejeter l'annonce",
  confirmerSuspension:
    "Suspendre cette annonce ? Elle disparaît des recherches jusqu'à une nouvelle publication.",
  ouiSuspendre: "Oui, suspendre l'annonce",
  nonGarder: 'Non, ne rien changer',

  videTitre: 'Aucune annonce dans cette liste',
  videTexte:
    'Les annonces déposées ou modifiées par les propriétaires arrivent ici avant publication.',
  voirPubliees: 'Voir les annonces publiées',
} as const;
