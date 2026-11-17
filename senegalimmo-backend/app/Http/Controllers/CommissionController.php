<?php

namespace App\Http\Controllers;

use App\Models\Compte;
use App\Exceptions\OperationRefusee;
use App\Models\Portefeuille;
use Illuminate\Support\Facades\DB;
use App\Models\Commission;
use Illuminate\Http\Request;

class CommissionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Commission::with([
            'bien:id,titre,quartier,ville',
            'agence:id,nom,prenom',
            'agent:id,nom,prenom',
            'proprietaire:id,nom,prenom',
        ])->latest();

        if ($user->role === 'agent') {
            $query->where(fn ($q) => $q->where('agent_id', $user->id)->orWhere('agence_id', $user->id));
        } elseif ($user->role === 'proprietaire') {
            $query->where('proprietaire_id', $user->id);
        } else {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $liste = $query->get();

        return response()->json([
            'total'       => (float) $liste->sum('montant'),
            'due'         => (float) $liste->where('statut', 'due')->sum('montant'),
            'reglee'      => (float) $liste->where('statut', 'reglee')->sum('montant'),
            'commissions' => $liste,
        ]);
    }

    // L'agence ou l'agent marque la commission comme réglée par le propriétaire
    public function regler(Request $request, Commission $commission)
    {
        $user = $request->user();
        $estMandataire = $user->role === 'agent'
            && ($commission->agence_id === $user->id || $commission->agent_id === $user->id);

        if (!$estMandataire) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if ($commission->statut !== 'due') {
            return response()->json(['message' => 'Cette commission est déjà réglée.'], 422);
        }

        $commission->update(['statut' => 'reglee', 'reglee_le' => now()]);

        return response()->json($commission);
    }
        // Le propriétaire règle la commission depuis son portefeuille : virement interne vers l'agent immobilier / l'agence
    public function payer(Request $request, Commission $commission)
    {
        $user = $request->user();

        if ($user->role !== 'proprietaire' || $commission->proprietaire_id !== $user->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if ($commission->statut !== 'due') {
            return response()->json(['message' => 'Cette commission est déjà réglée.'], 422);
        }

        $titre = $commission->bien?->titre;
        $beneficiaireId = $commission->agent_id ?: $commission->agence_id;

        $agent = Compte::tous()->findOrFail($beneficiaireId);
        try {
            DB::transaction(function () use ($commission, $user, $agent, $titre) {
                Portefeuille::de($user)->verserCommission(Portefeuille::de($agent), (int) round((float) $commission->montant), (string) $titre);
                $commission->update(['statut' => 'reglee', 'reglee_le' => now()]);
            });
        } catch (OperationRefusee $e) {
            return response()->json(['message' => 'Solde insuffisant pour régler cette commission.'], 422);
        }

        return response()->json($commission->fresh());
    }
}