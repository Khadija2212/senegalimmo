export const TEXTES_NOTIFICATION = {
  titre: 'Envoyer une notification',
  intro: 'Un message à un compte précis, ou à tous les comptes actifs d’un rôle.',
  destinataires: 'Destinataires',
  modes: [
    { valeur: 'role', libelle: "Tous les comptes d'un rôle" },
    { valeur: 'compte', libelle: 'Un compte précis' },
  ],
  role: 'Rôle des destinataires',
  roles: [
    { valeur: 'client', libelle: 'Clients' },
    { valeur: 'proprietaire', libelle: 'Propriétaires' },
    { valeur: 'agent', libelle: 'Agents' },
    { valeur: 'administrateur', libelle: 'Administrateurs' },
  ],
  canal: 'Canal',
  canaux: [
    { valeur: 'push', libelle: 'Dans l’application' },
    { valeur: 'email', libelle: 'E-mail' },
    { valeur: 'sms', libelle: 'SMS' },
  ],
  labelTitre: 'Titre',
  labelContenu: 'Message',
  restants: (n: number) => (n > 1 ? `${n} caractères restants` : `${n} caractère restant`),
  envoyer: 'Envoyer la notification',
  envoiEnCours: 'Envoi en cours',
  envoyee: (n: number) =>
    n > 1
      ? `Notification envoyée à ${n} comptes.`
      : n === 1
        ? 'Notification envoyée à 1 compte.'
        : 'Aucun compte actif ne correspond : rien n’a été envoyé.',
  nouvelle: 'Écrire une autre notification',

  chercherCompte: 'Chercher le compte',
  placeholderCompte: 'Nom, prénom ou e-mail',
  aucunCompte: 'Aucun compte ne correspond.',
  choisir: (nom: string, email: string) => `${nom}, ${email}`,
  compteChoisi: 'Compte choisi',
  changer: 'Changer de compte',
  resultats: 'Comptes trouvés',
} as const;
