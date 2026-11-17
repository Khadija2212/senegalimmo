<?php

namespace App\Http\Controllers;

use App\Models\Annonce;
use App\Models\Client;
use App\Models\DemandeLocation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cas « Demander une location » (client) ; « Gérer demandes de location » (propriétaire),
 * étendu par « Accepter ou refuser demande » ; « Traiter demandes clients » (agent).
 */
class DemandeLocationController extends Controller
{
    private const DUREE_MAX_MOIS = 120;

    public function index(Request $request): JsonResponse
    {
        $compte = $request->user();
        $requete = $compte instanceof Client
            ? $compte->demandesLocation()
            : DemandeLocation::whereHas('annonce', fn (Builder $q) => $q->whereIn('bien_id', $this->biensGeres($compte)));

        return response()->json($requete->with(['annonce.bien', 'client:id,prenom,nom,telephone,profession', 'bail'])->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $d = $request->validate([
            'annonce_id' => ['required', 'uuid', 'exists:annonces,id'],
            'date_entree_souhaitee' => ['required', 'date'],
            'duree_mois' => ['required', 'integer', 'min:1', 'max:'.self::DUREE_MAX_MOIS],
            'message' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);
        $demande = $request->user()->demanderLocation(Annonce::findOrFail($d['annonce_id']), Carbon::parse($d['date_entree_souhaitee']), $d['duree_mois'], $d['message'] ?? null);

        return response()->json($demande, Response::HTTP_CREATED);
    }

    public function accepter(Request $request, DemandeLocation $demande): JsonResponse
    {
        $this->exigerGestion($demande->annonce->bien, $request->user());
        $demande->accepter();

        return response()->json($demande);
    }

    public function refuser(Request $request, DemandeLocation $demande): JsonResponse
    {
        $this->exigerGestion($demande->annonce->bien, $request->user());
        $demande->refuser($request->validate(['motif' => ['required', 'string', 'max:1000']])['motif']);

        return response()->json($demande);
    }
}
