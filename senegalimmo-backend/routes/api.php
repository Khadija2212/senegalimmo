<?php

use App\Http\Controllers\PortefeuilleController;
use App\Http\Controllers\RetraitController;
use App\Http\Controllers\AdminUtilisateurController;
use App\Http\Controllers\AlerteController;
use App\Http\Controllers\ProfilController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\AnnonceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BienController;
use App\Http\Controllers\CategorieController;
use App\Http\Controllers\ChangeController;
use App\Http\Controllers\CommissionController;
use App\Http\Controllers\ContratController;
use App\Http\Controllers\DemandeLocationController;
use App\Http\Controllers\EtatDesLieuxController;
use App\Http\Controllers\FavoriController;
use App\Http\Controllers\MandatController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotationController;
use App\Http\Controllers\OffreAchatController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\NotificationPaiementController;
use App\Http\Controllers\PromesseVenteController;
use App\Http\Controllers\SignalementController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\VisiteController;
use Illuminate\Support\Facades\Route;

// ===== Routes publiques =====
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/biens-publics', [BienController::class, 'publicIndex']);
Route::get('/biens-publics/{bien}', [BienController::class, 'publicShow']);
Route::get('/categories', [CategorieController::class, 'index']);

Route::get('/proprietaires/{id}/avis', [NotationController::class, 'avis'])->whereNumber('id');
Route::get('/taux-change', [ChangeController::class, 'index']);

// Appelée par la passerelle de paiement (authentifiée par signature, pas par jeton)
Route::post('/paiements/ipn', [NotificationPaiementController::class, 'ipn']);
// Page de paiement de la passerelle simulée (développement local uniquement)
Route::get('/paiements/simulation/{reference}/{jeton}', [NotificationPaiementController::class, 'simulation']);

// ===== Routes protégées =====
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profil', [AuthController::class, 'modifierProfil']);
    Route::put('/profil/mot-de-passe', [AuthController::class, 'changerMotDePasse']);
    Route::post('/profil/document', [AuthController::class, 'televerserDocument']);
    Route::put('/profil/devise', [AuthController::class, 'devise']);

    Route::get('/stats', [StatsController::class, 'index']);

    // Favoris
    Route::get('/favoris', [FavoriController::class, 'index']);
    Route::get('/favoris/ids', [FavoriController::class, 'ids']);
    Route::post('/favoris/toggle', [FavoriController::class, 'toggle']);

    // Biens
    Route::post('/biens/{bien}/photos', [BienController::class, 'ajouterPhotos']);
    Route::post('/biens/{bien}/photos/supprimer', [BienController::class, 'supprimerPhoto']);
    Route::apiResource('biens', BienController::class);

    // Annonces
    Route::put('/annonces/{annonce}/verification', [AnnonceController::class, 'verification']);
    Route::apiResource('annonces', AnnonceController::class);

    // Visites
    Route::apiResource('visites', VisiteController::class);

    // Location
    Route::get('/demandes-location', [DemandeLocationController::class, 'index']);
    Route::post('/demandes-location', [DemandeLocationController::class, 'store']);
    Route::put('/demandes-location/{demande}', [DemandeLocationController::class, 'update']);

    Route::post('/contrats/{contrat}/signer', [ContratController::class, 'signer']);
    Route::get('/contrats/{contrat}/pdf', [ContratController::class, 'pdf']);
    Route::get('/contrats/{contrat}/echeancier', [PaiementController::class, 'echeancier']);
    Route::apiResource('contrats', ContratController::class);

    Route::get('/etats-des-lieux', [EtatDesLieuxController::class, 'index']);
    Route::post('/etats-des-lieux', [EtatDesLieuxController::class, 'store']);
    Route::post('/etats-des-lieux/{etat}/valider', [EtatDesLieuxController::class, 'valider']);

    // Paiements
    Route::get('/paiements', [PaiementController::class, 'index']);
    Route::post('/paiements/initier', [PaiementController::class, 'initier']);
    Route::get('/paiements/ref/{reference}', [PaiementController::class, 'showByReference']);
    Route::get('/paiements/{paiement}/quittance', [PaiementController::class, 'quittance']);

    // Vente
    Route::get('/offres-achat', [OffreAchatController::class, 'index']);
    Route::post('/offres-achat', [OffreAchatController::class, 'store']);
    Route::put('/offres-achat/{offre}', [OffreAchatController::class, 'update']);

    Route::get('/promesses-vente', [PromesseVenteController::class, 'index']);
    Route::post('/promesses-vente', [PromesseVenteController::class, 'store']);
    Route::post('/promesses-vente/{promesse}/signer', [PromesseVenteController::class, 'signer']);
    Route::get('/promesses-vente/{promesse}/pdf', [PromesseVenteController::class, 'pdf']);

    // Signalements
    Route::get('/signalements', [SignalementController::class, 'index']);
    Route::post('/signalements', [SignalementController::class, 'store']);
    Route::put('/signalements/{signalement}', [SignalementController::class, 'update']);

    // Demandes de retrait

    // Catégories (admin CRUD)
    Route::post('/categories', [CategorieController::class, 'store']);
    Route::put('/categories/{categorie}', [CategorieController::class, 'update']);
    Route::delete('/categories/{categorie}', [CategorieController::class, 'destroy']);

    // Administration : utilisateurs & statistiques
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::put('/admin/users/{user}/statut', [AdminUserController::class, 'toggleStatut']);
    Route::put('/admin/users/{user}/valider', [AdminUserController::class, 'validerDocument']);
    Route::get('/admin/users/{user}/document', [AdminUserController::class, 'document']);
    Route::get('/admin/export-stats', [AdminUserController::class, 'exportStats']);

    // Messagerie
    Route::get('/conversations', [MessageController::class, 'conversations']);
    Route::get('/messages', [MessageController::class, 'index']);
    Route::post('/messages', [MessageController::class, 'store']);

    // Notation
    Route::get('/notations/a-faire', [NotationController::class, 'aFaire']);
    Route::post('/notations', [NotationController::class, 'store']);

    // Agences, agents, mandats, commissions
    Route::get('/agences', [MandatController::class, 'agences']);
    Route::get('/mandats', [MandatController::class, 'index']);
    Route::post('/mandats', [MandatController::class, 'store']);
    Route::put('/mandats/{mandat}', [MandatController::class, 'update']);
    Route::put('/mandats/{mandat}/agent', [MandatController::class, 'assigner']);
    Route::get('/biens-geres', [MandatController::class, 'biensGeres']);

    Route::get('/agents', [AgentController::class, 'index']);
    Route::post('/agents', [AgentController::class, 'store']);
    Route::put('/agents/{agent}/statut', [AgentController::class, 'statut']);

    Route::get('/commissions', [CommissionController::class, 'index']);
    Route::put('/commissions/{commission}/regler', [CommissionController::class, 'regler']);

        // Alertes
    Route::get('/alertes', [AlerteController::class, 'index']);
    Route::post('/alertes/lire-tout', [AlerteController::class, 'lireTout']);
    Route::post('/alertes/{alerte}/lire', [AlerteController::class, 'lire']);

    // Profil
    Route::get('/profil', [ProfilController::class, 'show']);
    Route::put('/profil', [ProfilController::class, 'update']);
    Route::put('/profil/mot-de-passe', [ProfilController::class, 'motDePasse']);
    Route::post('/profil/document', [ProfilController::class, 'document']);
    Route::get('/profil/document', [ProfilController::class, 'documentVoir']);

    // Administration des utilisateurs
    Route::get('/admin/utilisateurs', [AdminUtilisateurController::class, 'index']);
    Route::put('/admin/utilisateurs/{user}/statut', [AdminUtilisateurController::class, 'statut']);
    Route::put('/admin/utilisateurs/{user}/verification', [AdminUtilisateurController::class, 'verification']);
    Route::get('/admin/utilisateurs/{user}/document', [AdminUtilisateurController::class, 'document']);
        // Portefeuille et retraits
    Route::get('/portefeuille', [PortefeuilleController::class, 'show']);
    Route::post('/retraits', [RetraitController::class, 'demander']);
    Route::get('/admin/retraits', [RetraitController::class, 'adminIndex']);
    Route::post('/admin/retraits/{retrait}/traiter', [RetraitController::class, 'traiter']);

    Route::put('/commissions/{commission}/payer', [CommissionController::class, 'payer']);
});
