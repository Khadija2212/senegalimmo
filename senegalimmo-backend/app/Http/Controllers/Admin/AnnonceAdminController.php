<?php

namespace App\Http\Controllers\Admin;

use App\Enums\DecisionModeration;
use App\Enums\StatutAnnonce;
use App\Http\Controllers\Controller;
use App\Models\Annonce;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Cas « Modérer les annonces », étendu par « Attribuer le badge vérifié ». */
class AnnonceAdminController extends Controller
{
    private const PAR_PAGE = 30;

    public function index(Request $request): JsonResponse
    {
        $statut = $request->validate(['statut' => ['sometimes', Rule::enum(StatutAnnonce::class)]])['statut'] ?? StatutAnnonce::EN_MODERATION->value;

        return response()->json(Annonce::where('statut', $statut)
            ->with('bien.medias', 'bien.proprietaire:id,prenom,nom,identite_verifiee')
            ->oldest('updated_at')->paginate(self::PAR_PAGE));
    }

    public function moderer(Request $request, Annonce $annonce): JsonResponse
    {
        $decision = $request->validate(['decision' => ['required', Rule::enum(DecisionModeration::class)]])['decision'];
        $request->user()->modererAnnonce($annonce, DecisionModeration::from($decision));

        return response()->json($annonce->fresh());
    }

    public function badge(Request $request, Annonce $annonce): JsonResponse
    {
        $request->user()->attribuerBadge($annonce);

        return response()->json($annonce);
    }
}
