import { Routes } from '@angular/router';
import { gardeClient } from './core/session/garde-client';
import { gardeRole } from './core/session/garde-role';

/** Comptes qui échangent, signent et paient : tous sauf l'administrateur. */
const UTILISATEURS = ['client', 'proprietaire', 'agent'] as const;
const TOUS = ['client', 'proprietaire', 'agent', 'administrateur'] as const;

/* Tous les écrans vivent dans le cadre public (en-tête, pied de page). */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/cadre-public/cadre-public').then((m) => m.CadrePublic),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/accueil/accueil').then((m) => m.Accueil),
      },
      {
        path: 'annonces/:id',
        loadComponent: () =>
          import('./features/annonce/annonce-detail').then((m) => m.AnnonceDetail),
      },
      {
        path: 'comparateur',
        loadComponent: () =>
          import('./features/comparateur/comparateur').then((m) => m.Comparateur),
      },
      {
        path: 'espace',
        canActivate: [gardeClient],
        loadComponent: () => import('./features/espace/espace-client').then((m) => m.EspaceClient),
      },
      {
        path: 'proprietaire',
        canActivate: [gardeRole('proprietaire')],
        loadComponent: () =>
          import('./features/proprietaire/espace-proprietaire').then((m) => m.EspaceProprietaire),
      },
      {
        path: 'proprietaire/publier',
        canActivate: [gardeRole('proprietaire')],
        loadComponent: () =>
          import('./features/proprietaire/publier/publier-bien').then((m) => m.PublierBien),
      },
      {
        path: 'portefeuille',
        canActivate: [gardeRole('proprietaire', 'agent')],
        loadComponent: () =>
          import('./features/portefeuille/portefeuille').then((m) => m.Portefeuille),
      },
      {
        path: 'agent',
        canActivate: [gardeRole('agent')],
        loadComponent: () => import('./features/agent/espace-agent').then((m) => m.EspaceAgent),
      },
      {
        path: 'admin',
        canActivate: [gardeRole('administrateur')],
        loadComponent: () => import('./features/admin/espace-admin').then((m) => m.EspaceAdmin),
      },
      {
        path: 'contrats',
        canActivate: [gardeRole(...UTILISATEURS)],
        loadComponent: () => import('./features/contrats/contrats').then((m) => m.Contrats),
      },
      {
        path: 'contrats/nouveau-bail',
        canActivate: [gardeRole('proprietaire')],
        loadComponent: () =>
          import('./features/contrats/nouveau-bail').then((m) => m.NouveauBail),
      },
      {
        path: 'contrats/:id',
        canActivate: [gardeRole(...UTILISATEURS)],
        loadComponent: () =>
          import('./features/contrats/contrat-detail').then((m) => m.ContratDetail),
      },
      {
        path: 'paiements',
        canActivate: [gardeRole(...UTILISATEURS)],
        loadComponent: () => import('./features/paiements/paiements').then((m) => m.Paiements),
      },
      {
        path: 'paiement/retour',
        canActivate: [gardeRole(...UTILISATEURS)],
        loadComponent: () =>
          import('./features/paiements/retour-paiement').then((m) => m.RetourPaiement),
      },
      {
        path: 'messages',
        canActivate: [gardeRole(...UTILISATEURS)],
        loadComponent: () => import('./features/messages/messagerie').then((m) => m.Messagerie),
      },
      {
        path: 'notifications',
        canActivate: [gardeRole(...TOUS)],
        loadComponent: () =>
          import('./features/notifications/notifications').then((m) => m.Notifications),
      },
      {
        path: 'profil',
        canActivate: [gardeRole(...TOUS)],
        loadComponent: () => import('./features/profil/profil').then((m) => m.Profil),
      },
    ],
  },
  {
    path: 'connexion',
    data: { onglet: 'connexion' },
    loadComponent: () => import('./features/connexion/connexion').then((m) => m.Connexion),
  },
  {
    path: 'inscription',
    data: { onglet: 'inscription' },
    loadComponent: () => import('./features/connexion/connexion').then((m) => m.Connexion),
  },

  /* Anciennes adresses, gardées pour les liens déjà partagés. */
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'login', redirectTo: 'connexion', pathMatch: 'full' },
  { path: 'register', redirectTo: 'inscription', pathMatch: 'full' },
  { path: 'favoris', redirectTo: '/espace?rubrique=favoris', pathMatch: 'full' },
  { path: 'visites', redirectTo: 'espace', pathMatch: 'full' },
  { path: 'demandes', redirectTo: 'espace', pathMatch: 'full' },
  { path: 'offres', redirectTo: 'espace', pathMatch: 'full' },
  { path: 'locataire/dashboard', redirectTo: 'espace', pathMatch: 'full' },
  { path: 'acheteur/dashboard', redirectTo: 'espace', pathMatch: 'full' },
  { path: 'client/dashboard', redirectTo: 'espace', pathMatch: 'full' },
  { path: 'promesses', redirectTo: 'contrats', pathMatch: 'full' },
  { path: 'quittances', redirectTo: 'paiements', pathMatch: 'full' },
  { path: 'alertes', redirectTo: 'notifications', pathMatch: 'full' },
  { path: 'proprietaire/dashboard', redirectTo: 'proprietaire', pathMatch: 'full' },
  { path: 'proprietaire/biens', redirectTo: '/proprietaire?rubrique=biens', pathMatch: 'full' },
  {
    path: 'proprietaire/annonces',
    redirectTo: '/proprietaire?rubrique=biens',
    pathMatch: 'full',
  },
  { path: 'mes-annonces', redirectTo: '/proprietaire?rubrique=biens', pathMatch: 'full' },
  { path: 'agent/dashboard', redirectTo: 'agent', pathMatch: 'full' },
  { path: 'agence/dashboard', redirectTo: 'agent', pathMatch: 'full' },
  { path: 'agents', redirectTo: 'agent', pathMatch: 'full' },
  { path: 'biens-geres', redirectTo: '/agent?rubrique=biens', pathMatch: 'full' },
  { path: 'mandats', redirectTo: '/agent?rubrique=mandats', pathMatch: 'full' },
  { path: 'commissions', redirectTo: '/admin?rubrique=commissions', pathMatch: 'full' },
  { path: 'admin/dashboard', redirectTo: 'admin', pathMatch: 'full' },
  { path: 'admin/annonces', redirectTo: '/admin?rubrique=annonces', pathMatch: 'full' },
  { path: 'admin/utilisateurs', redirectTo: '/admin?rubrique=comptes', pathMatch: 'full' },
  { path: 'admin/retraits', redirectTo: '/admin?rubrique=retraits', pathMatch: 'full' },
  { path: 'admin/signalements', redirectTo: '/admin?rubrique=signalements', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
