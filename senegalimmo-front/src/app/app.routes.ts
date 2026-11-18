import { Routes } from '@angular/router';
import { gardeClient } from './core/session/garde-client';

/* Les écrans refaits sont dans le cadre public ; les anciens écrans gardent leurs routes en attendant leur maquette. */

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
        path: 'espace',
        canActivate: [gardeClient],
        loadComponent: () => import('./features/espace/espace-client').then((m) => m.EspaceClient),
      },
      {
        path: 'annonces/:id',
        loadComponent: () =>
          import('./features/annonce/annonce-detail').then((m) => m.AnnonceDetail),
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
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full',
  },
  {
    path: 'biens/:id',
    loadComponent: () => import('./pages/bien-detail/bien-detail').then((m) => m.BienDetail),
  },
  { path: 'favoris', redirectTo: '/espace?rubrique=favoris', pathMatch: 'full' },
  {
    path: 'comparateur',
    loadComponent: () => import('./pages/comparateur/comparateur').then((m) => m.Comparateur),
  },
  {
    path: 'profil',
    loadComponent: () => import('./pages/profil/profil').then((m) => m.Profil),
  },
  { path: 'visites', redirectTo: 'espace', pathMatch: 'full' },
  {
    path: 'admin/annonces',
    loadComponent: () =>
      import('./pages/admin/annonces-admin/annonces-admin').then((m) => m.AnnoncesAdmin),
  },
  {
    path: 'admin/utilisateurs',
    loadComponent: () =>
      import('./pages/admin/utilisateurs-admin/utilisateurs-admin').then(
        (m) => m.UtilisateursAdmin,
      ),
  },
  {
    path: 'admin/retraits',
    loadComponent: () =>
      import('./pages/admin/retraits-admin/retraits-admin').then((m) => m.RetraitsAdmin),
  },
  {
    path: 'admin/signalements',
    loadComponent: () =>
      import('./pages/admin/signalements-admin/signalements-admin').then(
        (m) => m.SignalementsAdmin,
      ),
  },
  {
    path: 'admin/categories',
    loadComponent: () =>
      import('./pages/admin/categories-admin/categories-admin').then((m) => m.CategoriesAdmin),
  },
  { path: 'demandes', redirectTo: 'espace', pathMatch: 'full' },
  {
    path: 'contrats',
    loadComponent: () => import('./pages/contrats/contrats').then((m) => m.Contrats),
  },
  {
    path: 'paiements',
    loadComponent: () => import('./pages/paiements/paiements').then((m) => m.Paiements),
  },
  {
    path: 'paiement/retour',
    loadComponent: () =>
      import('./pages/paiement-retour/paiement-retour').then((m) => m.PaiementRetour),
  },
  { path: 'offres', redirectTo: 'espace', pathMatch: 'full' },
  {
    path: 'promesses',
    loadComponent: () => import('./pages/promesses/promesses').then((m) => m.Promesses),
  },
  {
    path: 'messages',
    loadComponent: () => import('./pages/messages/messages').then((m) => m.Messages),
  },
  {
    path: 'alertes',
    loadComponent: () => import('./pages/alertes/alertes').then((m) => m.Alertes),
  },
  {
    path: 'profil',
    loadComponent: () => import('./pages/profil/profil').then((m) => m.Profil),
  },
  {
    path: 'portefeuille',
    loadComponent: () => import('./pages/portefeuille/portefeuille').then((m) => m.Portefeuille),
  },
  {
    path: 'quittances',
    loadComponent: () => import('./pages/quittances/quittances').then((m) => m.Quittances),
  },
  {
    path: 'notations',
    loadComponent: () => import('./pages/notations/notations').then((m) => m.Notations),
  },
  {
    path: 'avis/:id',
    loadComponent: () => import('./pages/avis/avis').then((m) => m.Avis),
  },
  {
    path: 'contrats/:id/etats-des-lieux',
    loadComponent: () => import('./pages/etats-lieux/etats-lieux').then((m) => m.EtatsLieux),
  },
  {
    path: 'mandats',
    loadComponent: () => import('./pages/mandats/mandats').then((m) => m.Mandats),
  },
  {
    path: 'agents',
    redirectTo: 'agent/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'biens-geres',
    loadComponent: () => import('./pages/biens-geres/biens-geres').then((m) => m.BiensGeres),
  },
  {
    path: 'commissions',
    loadComponent: () => import('./pages/commissions/commissions').then((m) => m.Commissions),
  },
  {
    path: 'agent/dashboard',
    loadComponent: () => import('./pages/dashboard/agent/agent').then((m) => m.Agent),
  },
  { path: 'login', redirectTo: 'connexion', pathMatch: 'full' },
  { path: 'register', redirectTo: 'inscription', pathMatch: 'full' },
  {
    path: 'proprietaire/dashboard',
    loadComponent: () =>
      import('./pages/dashboard/proprietaire/proprietaire').then((m) => m.Proprietaire),
  },
  {
    path: 'proprietaire/biens',
    loadComponent: () => import('./pages/dashboard/mes-biens/mes-biens').then((m) => m.MesBiens),
  },
  {
    path: 'proprietaire/annonces',
    loadComponent: () => import('./pages/dashboard/mes-biens/mes-biens').then((m) => m.MesBiens),
  },
  {
    path: 'mes-annonces',
    redirectTo: 'proprietaire/annonces',
    pathMatch: 'full',
  },
  { path: 'locataire/dashboard', redirectTo: 'espace', pathMatch: 'full' },
  { path: 'acheteur/dashboard', redirectTo: 'espace', pathMatch: 'full' },
  { path: 'client/dashboard', redirectTo: 'espace', pathMatch: 'full' },
  {
    path: 'agence/dashboard',
    redirectTo: 'agent/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./pages/dashboard/admin/admin').then((m) => m.Admin),
  },
];
