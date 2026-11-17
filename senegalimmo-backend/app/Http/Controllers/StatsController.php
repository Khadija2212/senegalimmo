<?php

namespace App\Http\Controllers;

use App\Models\Administrateur;
use App\Models\Utilisateur;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    /**
     * Cas « Consulter le tableau de bord » : polymorphisme du diagramme,
     * chaque classe concrète d'Utilisateur fournit ses propres indicateurs.
     */
    public function index(Request $request): JsonResponse
    {
        $compte = $request->user();

        $stats = match (true) {
            $compte instanceof Utilisateur => $compte->indicateursTableauDeBord(),
            $compte instanceof Administrateur => $compte->indicateursAdministration(),
            default => [],
        };

        return response()->json($stats);
    }
}
