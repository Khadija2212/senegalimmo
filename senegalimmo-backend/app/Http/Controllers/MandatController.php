<?php

namespace App\Http\Controllers;

use App\Enums\TypeMandat;
use App\Models\Agent;
use App\Models\Bien;
use App\Models\Mandat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cas « Mandater un agent » (propriétaire), qui inclut « Signer le contrat » ;
 * « Gérer les mandats » (agent), étendu par « Renouveler mandat » et « Résilier mandat ».
 */
class MandatController extends Controller
{
    private const DUREE_MAX_MOIS = 60;

    public function store(Request $request): JsonResponse
    {
        $d = $request->validate([
            'agent_id' => ['required', 'uuid'],
            'bien_id' => ['required', 'uuid', 'exists:biens,id'],
            'type' => ['required', Rule::enum(TypeMandat::class)],
            'taux_commission' => ['required', 'numeric', 'min:0', 'max:100'],
            'date_debut' => ['required', 'date', 'after_or_equal:today'],
            'date_fin' => ['required', 'date', 'after:date_debut'],
        ]);
        $mandat = $request->user()->mandaterAgent(Agent::findOrFail($d['agent_id']), Bien::findOrFail($d['bien_id']), TypeMandat::from($d['type']),
            (float) $d['taux_commission'], Carbon::parse($d['date_debut']), Carbon::parse($d['date_fin']));

        return response()->json($mandat, Response::HTTP_CREATED);
    }

    public function renouveler(Request $request, Mandat $mandat): JsonResponse
    {
        $this->exigerQue($mandat->concerne($request->user()));
        $mandat->renouveler($request->validate(['duree_mois' => ['required', 'integer', 'min:1', 'max:'.self::DUREE_MAX_MOIS]])['duree_mois']);

        return response()->json($mandat);
    }

    public function resilier(Request $request, Mandat $mandat): JsonResponse
    {
        $this->exigerQue($mandat->concerne($request->user()));
        $mandat->resilier($request->validate(['motif' => ['required', 'string', 'max:1000']])['motif']);

        return response()->json($mandat);
    }
}
