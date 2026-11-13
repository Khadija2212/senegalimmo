<?php

namespace App\Http\Controllers;

use App\Models\DemandeRetrait;
use App\Models\MouvementPortefeuille;
use App\Models\User;
use App\Services\Portefeuille;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DemandeRetraitController extends Controller
{
    // Liste des retraits (admin : tous, utilisateur : les siens)
    public function index(Request $request)
    {
        $user = $request->user();

        $query = DemandeRetrait::with('user:id,nom,prenom,email,telephone,solde_portefeuille')->latest();

        if ($user->role !== 'administrateur') {
            $query->where('user_id', $user->id);
        }

        return response()->json($query->get());
    }

    // Propriétaire / Agence : soumettre une demande de retrait
    public function store(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['proprietaire', 'agence', 'agent'], true)) {
            return response()->json(['message' => 'Seuls les propriétaires et agents immobiliers peuvent demander un retrait.'], 403);
        }

        $minimum = (int) config('services.retrait.minimum', 5000);

        $data = $request->validate([
            'montant'          => 'required|numeric|min:' . $minimum,
            'methode'          => 'required|in:wave,orange_money,virement',
            'numero_telephone' => 'required|string|max:30',
        ], [
            'montant.min' => 'Le montant minimum de retrait est de ' . number_format($minimum, 0, ',', ' ') . ' FCFA.',
        ]);

        if ((float) $user->solde_portefeuille < (float) $data['montant']) {
            return response()->json([
                'message' => 'Solde insuffisant. Votre solde disponible est de ' . number_format($user->solde_portefeuille, 0, ',', ' ') . ' FCFA.',
            ], 422);
        }

        $demande = DB::transaction(function () use ($user, $data) {
            $demande = DemandeRetrait::create([
                'user_id'          => $user->id,
                'montant'          => $data['montant'],
                'methode'          => $data['methode'],
                'numero_telephone' => $data['numero_telephone'],
                'statut'           => 'en_attente',
            ]);

            $ok = Portefeuille::debiter(
                $user->id,
                (float) $data['montant'],
                'Demande de retrait n°' . $demande->id . ' (en attente de traitement)'
            );

            if (!$ok) {
                abort(422, 'Solde insuffisant.');
            }

            return $demande;
        });

        return response()->json([
            'message' => 'Votre demande de retrait a été enregistrée. Elle sera traitée sous 24h.',
            'demande' => $demande,
        ], 201);
    }

    // Admin : valider ou rejeter un retrait
    public function traiter(Request $request, DemandeRetrait $demande)
    {
        if ($request->user()->role !== 'administrateur') {
            return response()->json(['message' => 'Accès réservé à l\'administrateur.'], 403);
        }

        if ($demande->statut !== 'en_attente') {
            return response()->json(['message' => 'Cette demande a déjà été traitée.'], 422);
        }

        $data = $request->validate([
            'action' => 'required|in:valider,rejeter',
            'motif'  => 'required_if:action,rejeter|nullable|string|max:500',
        ]);

        DB::transaction(function () use ($demande, $data) {
            $demandeur = User::lockForUpdate()->findOrFail($demande->user_id);

            // Vérifier si le montant a déjà été débité lors de la demande (réservation de fonds)
            $dejaDebite = MouvementPortefeuille::where('user_id', $demande->user_id)
                ->where('type', 'debit')
                ->where('libelle', 'like', '%retrait n°' . $demande->id . '%')
                ->exists();

            if ($data['action'] === 'valider') {
                if (!$dejaDebite) {
                    $ok = Portefeuille::debiter(
                        $demandeur->id,
                        (float) $demande->montant,
                        'Retrait n°' . $demande->id . ' validé'
                    );
                    if (!$ok) {
                        abort(422, 'Le solde de l\'utilisateur est devenu insuffisant.');
                    }
                }

                $demande->update([
                    'statut'     => 'validee',
                    'traitee_le' => now(),
                ]);
            } else {
                $demande->update([
                    'statut'      => 'rejetee',
                    'motif_rejet' => $data['motif'] ?? 'Demande rejetée par l\'administrateur.',
                    'traitee_le'  => now(),
                ]);

                // Si le montant avait été prélevé/bloqué lors de la demande, on rembourse immédiatement le portefeuille
                if ($dejaDebite) {
                    Portefeuille::crediter(
                        $demandeur->id,
                        (float) $demande->montant,
                        'Retrait n°' . $demande->id . ' rejeté : remboursement'
                    );
                }
            }
        });

        return response()->json([
            'message' => $data['action'] === 'valider' ? 'Retrait validé et solde débité.' : 'Demande rejetée et montant remboursé.',
            'demande' => $demande->fresh(['user']),
        ]);
    }
}
