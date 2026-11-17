<?php

namespace App\Http\Controllers;

use App\Enums\StatutValidation;
use App\Models\Agent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;

/** Cas « Consulter ses performances » et « Exporter planning » (agent) ; annuaire des agents validés. */
class AgentController extends Controller
{
    private const PLANNING_PAR_DEFAUT_JOURS = 30;

    /** Les agents validés, que le propriétaire peut mandater. */
    public function index(): JsonResponse
    {
        return response()->json(Agent::where('statut_validation', StatutValidation::VALIDE)
            ->orderBy('nom')->get(['id', 'prenom', 'nom', 'agence', 'photo_url', 'valide_le']));
    }

    public function performances(Request $request): JsonResponse
    {
        /** @var Agent $agent */
        $agent = $request->user();

        return response()->json(['taux_conversion' => $agent->tauxConversion()] + $agent->indicateursTableauDeBord());
    }

    public function planning(Request $request): Response
    {
        $d = $request->validate(['debut' => ['sometimes', 'date'], 'fin' => ['sometimes', 'date', 'after_or_equal:debut']]);
        $debut = Carbon::parse($d['debut'] ?? today());
        $fin = Carbon::parse($d['fin'] ?? $debut->copy()->addDays(self::PLANNING_PAR_DEFAUT_JOURS));

        return response($request->user()->exporterPlanning($debut, $fin), Response::HTTP_OK, [
            'Content-Type' => 'text/calendar; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="planning-visites.ics"',
        ]);
    }
}
