<?php

namespace App\Http\Controllers;

use App\Models\Portefeuille;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Cas « Consulter portefeuille » (propriétaire, agent). */
class PortefeuilleController extends Controller
{
    private const NB_ECRITURES = 50;

    private const NB_RETRAITS = 30;

    /** Cas « Consulter portefeuille » : les deux soldes, l'historique et les retraits. */
    public function show(Request $request): JsonResponse
    {
        $p = Portefeuille::de($request->user());

        return response()->json([
            'solde' => $p->solde_disponible,
            'solde_disponible' => $p->solde_disponible,
            'solde_en_attente' => $p->solde_en_attente,
            'mis_a_jour_le' => $p->mis_a_jour_le,
            'minimum' => (int) config('services.retrait.minimum'),
            'ecritures' => $p->ecritures()->latest('date')->latest('id')->limit(self::NB_ECRITURES)->get(),
            'retraits' => $p->retraits()->latest('id')->limit(self::NB_RETRAITS)->get(),
        ]);
    }
}
