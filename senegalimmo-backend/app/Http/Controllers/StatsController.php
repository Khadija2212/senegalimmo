<?php

namespace App\Http\Controllers;

use App\Models\Annonce;
use App\Models\Bien;
use App\Models\Commission;
use App\Models\Contrat;
use App\Models\DemandeLocation;
use App\Models\Retrait;
use App\Models\Favori;
use App\Models\Mandat;
use App\Models\Message;
use App\Models\Notation;
use App\Models\OffreAchat;
use App\Enums\StatutPaiement;
use App\Enums\StatutRetrait;
use App\Models\Paiement;
use App\Models\PromesseVente;
use App\Models\User;
use App\Models\Visite;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $estAgent = in_array($user->role, ['agent', 'agence'], true);

        $biensAgent = $estAgent
            ? Mandat::where(fn ($q) => $q->where('agent_id', $user->id)->orWhere('agence_id', $user->id))
                ->where('statut', 'actif')
                ->whereDate('date_fin', '>=', today())
                ->pluck('bien_id')
            : collect();

        $clientStats = [
            'demandes_location' => DemandeLocation::where('locataire_id', $user->id)->count(),
            'baux_actifs'       => Contrat::where('locataire_id', $user->id)->where('statut', 'signe')->count(),
            'offres_achat'      => OffreAchat::where('acheteur_id', $user->id)->count(),
            'promesses'         => PromesseVente::where('acheteur_id', $user->id)->where('statut', 'signee')->count(),
            'visites'           => Visite::where('demandeur_id', $user->id)->count(),
            'favoris'           => Favori::where('user_id', $user->id)->count(),
            'messages_non_lus'  => Message::where('destinataire_id', $user->id)->where('lu', false)->count(),
        ];

        $stats = match ($user->role) {
            'proprietaire' => [
                'biens'               => Bien::where('proprietaire_id', $user->id)->count(),
                'annonces_publiees'   => Annonce::where('auteur_id', $user->id)->where('statut', 'publiee')->count(),
                'annonces_en_attente' => Annonce::where('auteur_id', $user->id)->where('statut', 'en_attente')->count(),
                'visites_en_attente'  => Visite::where('proprietaire_id', $user->id)->where('statut', 'en_attente')->count(),
                'offres_en_attente'   => OffreAchat::where('proprietaire_id', $user->id)->where('statut', 'en_attente')->count(),
                'nb_avis'             => Notation::where('note_id', $user->id)->count(),
                'note_moyenne'        => round((float) Notation::where('note_id', $user->id)->avg('note'), 1),
                'messages_non_lus'    => Message::where('destinataire_id', $user->id)->where('lu', false)->count(),
                'solde'               => (int) ($user->portefeuille?->solde_disponible ?? 0),
            ],
            'client', 'locataire' => $clientStats,
            'acheteur' => [
                'offres_en_cours'  => OffreAchat::where('acheteur_id', $user->id)
                    ->whereIn('statut', ['en_attente', 'contre_proposee'])->count(),
                'offres_acceptees' => OffreAchat::where('acheteur_id', $user->id)->where('statut', 'acceptee')->count(),
                'promesses'        => PromesseVente::where('acheteur_id', $user->id)->where('statut', 'signee')->count(),
                'visites'          => Visite::where('demandeur_id', $user->id)->count(),
                'favoris'          => Favori::where('user_id', $user->id)->count(),
                'messages_non_lus' => Message::where('destinataire_id', $user->id)->where('lu', false)->count(),
            ],
            'agent', 'agence' => [
                'biens_assignes'     => $biensAgent->count(),
                'mandats_actifs'     => $biensAgent->count(),
                'mandats_en_attente' => Mandat::where(fn ($q) => $q->where('agent_id', $user->id)->orWhere('agence_id', $user->id))
                    ->where('statut', 'propose')->count(),
                'visites_en_attente' => Visite::where(fn ($q) => $q->where('agent_id', $user->id)->orWhereIn('bien_id', $biensAgent))
                    ->where('statut', 'en_attente')->count(),
                'transactions'       => Commission::where(fn ($q) => $q->where('agent_id', $user->id)->orWhere('agence_id', $user->id))->count(),
                'commissions'        => (float) Commission::where(fn ($q) => $q->where('agent_id', $user->id)->orWhere('agence_id', $user->id))->sum('montant'),
                'commissions_dues'   => (float) Commission::where(fn ($q) => $q->where('agent_id', $user->id)->orWhere('agence_id', $user->id))
                    ->where('statut', 'due')->sum('montant'),
                'solde'              => (int) ($user->portefeuille?->solde_disponible ?? 0),
            ],
            'administrateur' => [
                'utilisateurs'        => User::where('role', '!=', 'administrateur')->count(),
                'annonces_en_attente' => Annonce::where('statut', 'en_attente')->count(),
                'retraits_en_attente' => Retrait::where('statut', StatutRetrait::DEMANDE)->count(),
                'volume'              => (int) Paiement::tous()->where('statut', StatutPaiement::REUSSI)->sum('montant'),
                 'verifications_en_attente' => User::where('verification', 'en_attente')->count(),
            ],
            default => [],
        };

        return response()->json($stats);
    }
}