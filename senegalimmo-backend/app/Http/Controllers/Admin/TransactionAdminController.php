<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StatutPaiement;
use App\Http\Controllers\Controller;
use App\Models\Paiement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Cas « Consulter les transactions » : tous les paiements, filtrés. */
class TransactionAdminController extends Controller
{
    private const PAR_PAGE = 50;

    public function index(Request $request): JsonResponse
    {
        $f = $request->validate([
            'statut' => ['sometimes', Rule::enum(StatutPaiement::class)],
            'type' => ['sometimes', Rule::in(array_keys(Paiement::sousClasses()))],
            'du' => ['sometimes', 'date'],
            'au' => ['sometimes', 'date', 'after_or_equal:du'],
        ]);
        $requete = Paiement::tous()->with('recu')
            ->when(isset($f['statut']), fn ($q) => $q->where('statut', $f['statut']))
            ->when(isset($f['type']), fn ($q) => $q->where('type', $f['type']))
            ->when(isset($f['du']), fn ($q) => $q->whereDate('created_at', '>=', $f['du']))
            ->when(isset($f['au']), fn ($q) => $q->whereDate('created_at', '<=', $f['au']));

        return response()->json([
            'total' => (int) (clone $requete)->where('statut', StatutPaiement::REUSSI)->sum('montant'),
            'commissions' => (int) (clone $requete)->where('statut', StatutPaiement::REUSSI)->sum('commission'),
            'paiements' => $requete->latest()->paginate(self::PAR_PAGE),
        ]);
    }
}
