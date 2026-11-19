export const TEXTES_COMPTES = {
  titre: 'Comptes',
  intro:
    'Tous les comptes, les plus récents en premier. Un compte suspendu ne peut plus se connecter.',
  filtre: 'Rôle des comptes',
  filtres: [
    { valeur: '', libelle: 'Tous' },
    { valeur: 'client', libelle: 'Clients' },
    { valeur: 'proprietaire', libelle: 'Propriétaires' },
    { valeur: 'agent', libelle: 'Agents' },
    { valeur: 'administrateur', libelle: 'Administrateurs' },
  ],
  recherche: 'Rechercher un compte',
  placeholderRecherche: 'Nom, prénom ou e-mail',
  roles: {
    client: 'Client',
    proprietaire: 'Propriétaire',
    agent: 'Agent',
    administrateur: 'Administrateur',
  },
  inscritLe: (date: string) => `inscrit le ${date}`,
  actif: 'Actif',
  suspendu: 'Suspendu',
  supprime: 'Supprimé',
  validationEnAttente: 'Validation en attente',
  agentValide: 'Agent validé',
  validationRefusee: 'Validation refusée',
  identiteVerifiee: 'Identité vérifiée',
  identiteNonVerifiee: 'Identité non vérifiée',
  agence: (nom: string) => `agence ${nom}`,
  carte: (numero: string) => `carte professionnelle ${numero}`,

  valider: "Valider l'agent",
  refuser: 'Refuser',
  confirmerRefus:
    'Refuser la validation de cet agent ? Il ne pourra pas recevoir de mandats et sera prévenu.',
  ouiRefuser: 'Oui, refuser',
  voirPiece: "Voir la pièce d'identité",
  verifier: "Vérifier l'identité",
  noteVerifier: "Ouvrez d'abord la pièce d'identité pour la contrôler.",
  suspendre: 'Suspendre',
  confirmerSuspension: (nom: string) =>
    `Suspendre le compte de ${nom} ? Ses sessions sont fermées et il ne peut plus se connecter.`,
  ouiSuspendre: 'Oui, suspendre',
  reactiver: 'Réactiver',
  nonGarder: 'Non, ne rien changer',
  erreurPiece: "La pièce d'identité ne s'ouvre pas.",

  videTitre: 'Aucun compte trouvé',
  videTexte:
    'Aucun compte ne correspond à cette recherche. Vérifiez l’orthographe ou retirez le filtre.',
  effacer: 'Effacer la recherche',
} as const;
