<?php

namespace App\Http\Controllers;

use App\Models\Administrateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Cas « Consulter le tableau de bord » : l'opération polymorphe de chaque classe. */
class TableauDeBordController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $compte = $request->user();

        return response()->json($compte instanceof Administrateur
            ? $compte->indicateursAdministration()
            : $compte->indicateursTableauDeBord());
    }
}
