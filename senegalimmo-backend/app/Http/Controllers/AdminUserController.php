<?php

namespace App\Http\Controllers;

use App\Models\Administrateur;
use App\Models\Agent;
use App\Models\Proprietaire;
use App\Models\Client;
use App\Models\Compte;
use App\Models\Annonce;
use App\Models\Bien;
use App\Models\Retrait;
use App\Enums\StatutPaiement;
use App\Enums\StatutRetrait;
use App\Models\Paiement;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    // Admin : lister tous les utilisateurs
    public function index(Request $request)
    {
        if ($request->user()->role !== 'administrateur') {
            return response()->json(['message' => 'Accès réservé à l\'administrateur.'], 403);
        }

        $query = Compte::tous()->addSelect(['users.*',
            'biens_count' => Bien::selectRaw('count(*)')->whereColumn('proprietaire_id', 'users.id'),
            'annonces_count' => Annonce::selectRaw('count(*)')->whereColumn('auteur_id', 'users.id'),
        ])->latest();

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('search')) {
            $q = '%' . $request->search . '%';
            $query->where(function ($sub) use ($q) {
                $sub->where('nom', 'ILIKE', $q)
                    ->orWhere('prenom', 'ILIKE', $q)
                    ->orWhere('email', 'ILIKE', $q)
                    ->orWhere('telephone', 'ILIKE', $q);
            });
        }

        $users = $query->get()->map(function ($u) {
            $u->makeVisible(['document_identite']);
            return $u;
        });

        return response()->json($users);
    }

    // Admin : suspendre ou réactiver un utilisateur
    public function toggleStatut(Request $request, Compte $user)
    {
        if ($request->user()->role !== 'administrateur') {
            return response()->json(['message' => 'Accès réservé à l\'administrateur.'], 403);
        }

        if ($user->role === 'administrateur') {
            return response()->json(['message' => 'Impossible de suspendre un administrateur.'], 422);
        }

        $nouveauStatut = $user->statut === 'actif' ? 'suspendu' : 'actif';
        $user->update(['statut' => $nouveauStatut]);

        return response()->json([
            'message' => 'Statut du compte mis à jour avec succès.',
            'user'    => $user->makeVisible(['document_identite']),
        ]);
    }

    // Admin : valider ou révoquer la vérification d'un utilisateur
    public function validerDocument(Request $request, Compte $user)
    {
        if ($request->user()->role !== 'administrateur') {
            return response()->json(['message' => 'Accès réservé à l\'administrateur.'], 403);
        }

        $action = $request->input('action');
        if ($action === 'revoquer') {
            $nouveauStatutVerifie = false;
        } elseif ($action === 'valider') {
            $nouveauStatutVerifie = true;
        } else {
            $nouveauStatutVerifie = !$user->est_verifie;
        }

        $user->update([
            'est_verifie'        => $nouveauStatutVerifie,
            'verification'       => $nouveauStatutVerifie ? 'verifie' : 'non_soumis',
            'verification_motif' => null,
        ]);

        $msg = $nouveauStatutVerifie
            ? "L'identité et le compte de {$user->prenom} {$user->nom} ont été validés avec succès."
            : "La vérification du compte de {$user->prenom} {$user->nom} a été révoquée.";

        return response()->json([
            'message' => $msg,
            'user'    => $user->makeVisible(['document_identite']),
        ]);
    }

    // Admin : télécharger ou afficher la pièce d'identité d'un utilisateur
    public function document(Request $request, Compte $user)
    {
        if ($request->user()->role !== 'administrateur') {
            return response()->json(['message' => 'Accès réservé à l\'administrateur.'], 403);
        }

        if (empty($user->document_identite)) {
            return response()->json(['message' => 'Cet utilisateur n\'a téléversé aucun document.'], 404);
        }

        $disks = ['local', 'public'];
        foreach ($disks as $disk) {
            if (\Illuminate\Support\Facades\Storage::disk($disk)->exists($user->document_identite)) {
                return \Illuminate\Support\Facades\Storage::disk($disk)->response($user->document_identite);
            }
        }

        $privatePath = storage_path('app/private/' . $user->document_identite);
        if (file_exists($privatePath)) {
            return response()->file($privatePath);
        }

        $publicPath = storage_path('app/public/' . $user->document_identite);
        if (file_exists($publicPath)) {
            return response()->file($publicPath);
        }

        return response()->json(['message' => 'Fichier introuvable sur le serveur.'], 404);
    }

    // Admin : exporter les statistiques de la plateforme en PDF (ou JSON si demandé)
    public function exportStats(Request $request)
    {
        if ($request->user()->role !== 'administrateur') {
            return response()->json(['message' => 'Accès réservé à l\'administrateur.'], 403);
        }

        $stats = [
            'date_generation'          => now()->format('d/m/Y H:i'),
            'total_utilisateurs'       => Compte::tous()->count(),
            'utilisateurs_verifies'    => Compte::tous()->where('est_verifie', true)->count(),
            'verifications_en_attente' => Compte::tous()->where('verification', 'en_attente')->count(),
            'utilisateurs_par_role'    => [
                'clients'         => Client::count(),
                'proprietaires'   => Proprietaire::count(),
                'agents'          => Agent::count(),
                'administrateurs' => Administrateur::count(),
            ],
            'total_biens'                 => Bien::count(),
            'biens_disponibles'           => Bien::where('statut', 'disponible')->count(),
            'biens_loues'                 => Bien::where('statut', 'loue')->count(),
            'biens_vendus'                => Bien::where('statut', 'vendu')->count(),
            'total_annonces'              => Annonce::count(),
            'annonces_publiees'           => Annonce::where('statut', 'publiee')->count(),
            'annonces_en_attente'         => Annonce::where('statut', 'en_attente')->count(),
            'volume_transactions_fcfa'    => (int) Paiement::tous()->where('statut', StatutPaiement::REUSSI)->sum('montant'),
            'nb_paiements_confirmes'      => Paiement::tous()->where('statut', StatutPaiement::REUSSI)->count(),
            'retraits_en_attente'         => Retrait::where('statut', StatutRetrait::DEMANDE)->count(),
            'retraits_valides'            => Retrait::where('statut', StatutRetrait::VERSE)->count(),
            'montant_retraits_valides_fcfa' => (int) Retrait::where('statut', StatutRetrait::VERSE)->sum('montant'),
        ];

        $format = strtolower((string) $request->query('format', 'pdf'));
        $dateSuffix = now()->format('Y-m-d');

        if ($format === 'json') {
            return response()->json($stats);
        }

        $admin = $request->user();
        $adminNom = trim(($admin->prenom ?? '') . ' ' . ($admin->nom ?? '')) ?: 'Administrateur';

        $html = view('pdf.statistiques', [
            'stats'    => $stats,
            'adminNom' => $adminNom,
        ])->render();

        $options = new Options();
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', false);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="rapport_statistiques_' . $dateSuffix . '.pdf"',
        ]);
    }
}
