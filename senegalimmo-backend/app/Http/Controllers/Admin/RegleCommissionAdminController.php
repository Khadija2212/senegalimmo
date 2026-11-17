<?php

namespace App\Http\Controllers\Admin;

use App\Enums\TypeTransaction;
use App\Http\Controllers\Controller;
use App\Models\RegleCommission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cas « Gérer les commissions » : l'administrateur définit les règles (association « définit »).
 * Une nouvelle règle remplace la précédente à sa date d'effet ; l'historique reste.
 */
class RegleCommissionAdminController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(RegleCommission::with('administrateur:id,prenom,nom')->orderByDesc('actif_depuis')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $d = $request->validate([
            'type_transaction' => ['required', Rule::enum(TypeTransaction::class)],
            'taux' => ['required', 'numeric', 'min:0', 'max:100'],
            'montant_minimum' => ['sometimes', 'integer', 'min:0'],
            'actif_depuis' => ['required', 'date', 'after_or_equal:today'],
        ]);

        return response()->json($request->user()->reglesCommission()->create($d), Response::HTTP_CREATED);
    }
}
