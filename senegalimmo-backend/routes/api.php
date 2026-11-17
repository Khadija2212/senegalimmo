<?php

use App\Http\Controllers\Admin\AnnonceAdminController;
use App\Http\Controllers\Admin\CompteAdminController;
use App\Http\Controllers\Admin\NotificationAdminController;
use App\Http\Controllers\Admin\OptionPremiumAdminController;
use App\Http\Controllers\Admin\RegleCommissionAdminController;
use App\Http\Controllers\Admin\SignalementAdminController;
use App\Http\Controllers\Admin\TransactionAdminController;
use App\Http\Controllers\AgentController;
use App\Http\Controllers\AnnonceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BailController;
use App\Http\Controllers\BienController;
use App\Http\Controllers\ContratController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\DemandeLocationController;
use App\Http\Controllers\EtatDesLieuxController;
use App\Http\Controllers\FavoriController;
use App\Http\Controllers\MandatController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\NotificationPaiementController;
use App\Http\Controllers\OffreAchatController;
use App\Http\Controllers\PaiementController;
use App\Http\Controllers\PortefeuilleController;
use App\Http\Controllers\ProfilController;
use App\Http\Controllers\RechercheController;
use App\Http\Controllers\RetraitController;
use App\Http\Controllers\SignalementController;
use App\Http\Controllers\TableauDeBordController;
use App\Http\Controllers\VisiteController;
use Illuminate\Support\Facades\Route;

/*
| Les routes suivent les diagrammes de cas d'utilisation : cas communs (Visiteur, Utilisateur),
| puis Client, Propriétaire, Agent et Administrateur. Les identifiants sont des UUID.
*/

// Visiteur : rechercher, filtrer, comparer, carte, consulter, s'inscrire, s'authentifier
Route::post('/inscription', [AuthController::class, 'inscrire'])->middleware('throttle:10,1');
Route::post('/connexion', [AuthController::class, 'connecter'])->middleware('throttle:10,1');
Route::get('/annonces', [RechercheController::class, 'rechercher']);
Route::get('/annonces/carte', [RechercheController::class, 'carte']);
Route::get('/annonces/comparer', [RechercheController::class, 'comparer']);
Route::get('/annonces/{annonce}', [RechercheController::class, 'consulter'])->whereUuid('annonce');
Route::get('/options-premium', [AnnonceController::class, 'optionsPremium']);

// Passerelle de paiement : authentifiée par signature, pas par jeton
Route::post('/paiements/ipn', [NotificationPaiementController::class, 'ipn']);
Route::get('/paiements/simulation/{reference}/{jeton}', [NotificationPaiementController::class, 'simulation']);

Route::middleware('auth:sanctum')->group(function (): void {
    // Utilisateur et Administrateur : profil, tableau de bord, notifications
    Route::post('/deconnexion', [AuthController::class, 'deconnecter']);
    Route::get('/moi', [AuthController::class, 'moi']);
    Route::post('/profil', [ProfilController::class, 'modifier']);
    Route::put('/profil/mot-de-passe', [ProfilController::class, 'changerMotDePasse']);
    Route::post('/profil/piece-identite', [ProfilController::class, 'televerserPieceIdentite']);
    Route::get('/profil/piece-identite', [ProfilController::class, 'pieceIdentite']);
    Route::get('/tableau-de-bord', TableauDeBordController::class);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/tout-lire', [NotificationController::class, 'toutLire']);
    Route::post('/notifications/{notification}/lire', [NotificationController::class, 'marquerLue']);

    Route::middleware('role:client,proprietaire,agent')->group(function (): void {
        // Échanger par messagerie
        Route::get('/conversations', [ConversationController::class, 'index']);
        Route::post('/conversations', [ConversationController::class, 'store']);
        Route::get('/conversations/{conversation}/messages', [ConversationController::class, 'messages']);
        Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'envoyer']);

        // Contrats : consulter, télécharger, signer, relancer
        Route::get('/contrats', [ContratController::class, 'index']);
        Route::get('/contrats/{contrat}', [ContratController::class, 'show']);
        Route::get('/contrats/{contrat}/document', [ContratController::class, 'document']);
        Route::post('/contrats/{contrat}/signer', [ContratController::class, 'signer']);
        Route::post('/signatures/{signature}/relancer', [ContratController::class, 'relancer']);
        Route::get('/baux/{bail}/echeancier', [BailController::class, 'echeancier']);
        Route::get('/baux/{bail}/etats-des-lieux', [EtatDesLieuxController::class, 'index']);

        // Demandes, offres, visites : lister et répondre
        Route::get('/demandes-location', [DemandeLocationController::class, 'index']);
        Route::get('/offres-achat', [OffreAchatController::class, 'index']);
        Route::get('/visites', [VisiteController::class, 'index']);
        Route::post('/visites/{visite}/annuler', [VisiteController::class, 'annuler']);
        Route::post('/visites/{visite}/reprogrammer', [VisiteController::class, 'reprogrammer']);

        // Paiements versés ou reçus, quittances
        Route::get('/paiements', [PaiementController::class, 'index']);
        Route::get('/paiements/reference/{reference}', [PaiementController::class, 'parReference']);
        Route::get('/paiements/{paiement}/quittance', [PaiementController::class, 'quittance']);
    });

    // Client
    Route::middleware('role:client')->group(function (): void {
        Route::get('/favoris', [FavoriController::class, 'index']);
        Route::post('/favoris/{annonce}', [FavoriController::class, 'store']);
        Route::delete('/favoris/{annonce}', [FavoriController::class, 'destroy']);
        Route::post('/demandes-location', [DemandeLocationController::class, 'store']);
        Route::post('/visites', [VisiteController::class, 'store']);
        Route::post('/offres-achat', [OffreAchatController::class, 'store']);
        Route::post('/offres-achat/{offre}/retirer', [OffreAchatController::class, 'retirer']);
        Route::get('/signalements', [SignalementController::class, 'index']);
        Route::post('/signalements', [SignalementController::class, 'store']);
        Route::post('/paiements/initier', [PaiementController::class, 'initier']);
        Route::post('/etats-des-lieux/{etat}/valider', [EtatDesLieuxController::class, 'valider']);
    });

    // Propriétaire et Agent : biens, annonces, médias, réponses aux clients, portefeuille
    Route::middleware('role:proprietaire,agent')->group(function (): void {
        Route::get('/biens', [BienController::class, 'index']);
        Route::get('/biens/{bien}', [BienController::class, 'show']);
        Route::put('/biens/{bien}', [BienController::class, 'update']);
        Route::post('/biens/{bien}/medias', [MediaController::class, 'store']);
        Route::delete('/medias/{media}', [MediaController::class, 'destroy']);
        Route::get('/mes-annonces', [AnnonceController::class, 'index']);
        Route::post('/mes-annonces', [AnnonceController::class, 'store']);
        Route::put('/mes-annonces/{annonce}', [AnnonceController::class, 'update']);
        Route::post('/mes-annonces/{annonce}/suspendre', [AnnonceController::class, 'suspendre']);
        Route::post('/mes-annonces/{annonce}/reprendre', [AnnonceController::class, 'reprendre']);
        Route::post('/mes-annonces/{annonce}/conclure', [AnnonceController::class, 'conclure']);
        Route::post('/mes-annonces/{annonce}/premium', [AnnonceController::class, 'activerPremium']);
        Route::post('/demandes-location/{demande}/accepter', [DemandeLocationController::class, 'accepter']);
        Route::post('/demandes-location/{demande}/refuser', [DemandeLocationController::class, 'refuser']);
        Route::post('/offres-achat/{offre}/refuser', [OffreAchatController::class, 'refuser']);
        Route::post('/visites/{visite}/confirmer', [VisiteController::class, 'confirmer']);
        Route::post('/visites/{visite}/refuser', [VisiteController::class, 'refuser']);
        Route::post('/mandats/{mandat}/renouveler', [MandatController::class, 'renouveler']);
        Route::post('/mandats/{mandat}/resilier', [MandatController::class, 'resilier']);
        Route::get('/portefeuille', [PortefeuilleController::class, 'show']);
        Route::post('/retraits', [RetraitController::class, 'demander']);
    });

    // Propriétaire
    Route::middleware('role:proprietaire')->group(function (): void {
        Route::post('/biens', [BienController::class, 'store']);
        Route::delete('/biens/{bien}', [BienController::class, 'destroy']);
        Route::post('/offres-achat/{offre}/accepter', [OffreAchatController::class, 'accepter']);
        Route::post('/baux', [BailController::class, 'store']);
        Route::post('/baux/{bail}/resilier', [BailController::class, 'resilier']);
        Route::post('/baux/{bail}/etats-des-lieux', [EtatDesLieuxController::class, 'store']);
        Route::get('/agents', [AgentController::class, 'index']);
        Route::post('/mandats', [MandatController::class, 'store']);
    });

    // Agent
    Route::middleware('role:agent')->group(function (): void {
        Route::get('/agent/performances', [AgentController::class, 'performances']);
        Route::get('/agent/planning', [AgentController::class, 'planning']);
        Route::post('/visites/{visite}/compte-rendu', [VisiteController::class, 'compteRendu']);
    });

    // Administrateur, par domaine de son niveau (RoleAdmin)
    Route::prefix('admin')->group(function (): void {
        Route::middleware('admin:moderateur')->group(function (): void {
            Route::get('/annonces', [AnnonceAdminController::class, 'index']);
            Route::post('/annonces/{annonce}/moderer', [AnnonceAdminController::class, 'moderer']);
            Route::post('/annonces/{annonce}/badge', [AnnonceAdminController::class, 'badge']);
            Route::get('/comptes', [CompteAdminController::class, 'index']);
            Route::post('/comptes/{compte}/suspendre', [CompteAdminController::class, 'suspendre']);
            Route::post('/comptes/{compte}/reactiver', [CompteAdminController::class, 'reactiver']);
            Route::get('/comptes/{compte}/piece-identite', [CompteAdminController::class, 'pieceIdentite']);
            Route::post('/agents/{agent}/valider', [CompteAdminController::class, 'validerAgent']);
            Route::post('/proprietaires/{proprietaire}/verifier-identite', [CompteAdminController::class, 'verifierIdentite']);
            Route::get('/signalements', [SignalementAdminController::class, 'index']);
            Route::post('/signalements/{signalement}/traiter', [SignalementAdminController::class, 'traiter']);
            Route::post('/notifications', [NotificationAdminController::class, 'envoyer']);
        });
        Route::middleware('admin:finance')->group(function (): void {
            Route::get('/retraits', [RetraitController::class, 'adminIndex']);
            Route::post('/retraits/{retrait}/traiter', [RetraitController::class, 'traiter']);
            Route::get('/transactions', [TransactionAdminController::class, 'index']);
            Route::get('/regles-commission', [RegleCommissionAdminController::class, 'index']);
            Route::post('/regles-commission', [RegleCommissionAdminController::class, 'store']);
            Route::get('/options-premium', [OptionPremiumAdminController::class, 'index']);
            Route::post('/options-premium', [OptionPremiumAdminController::class, 'store']);
            Route::put('/options-premium/{option}', [OptionPremiumAdminController::class, 'update']);
        });
    });
});
