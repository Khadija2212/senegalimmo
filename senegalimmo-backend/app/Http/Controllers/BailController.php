<?php

namespace App\Http\Controllers;

use App\Enums\StatutPaiement;
use App\Models\Bail;
use App\Models\DemandeLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Cas « Créer un bail » (propriétaire), qui inclut « Notifier locataire » ; échéancier et résiliation. */
class BailController extends Controller
{
    private const JOUR_ECHEANCE_MAX = 28;

    public function store(Request $request): JsonResponse
    {
        $d = $request->validate([
            'demande_location_id' => ['required', 'uuid', 'exists:demandes_location,id'],
            'jour_echeance' => ['sometimes', 'integer', 'min:1', 'max:'.self::JOUR_ECHEANCE_MAX],
        ]);
        $demande = DemandeLocation::findOrFail($d['demande_location_id']);
        $bail = isset($d['jour_echeance'])
            ? $request->user()->creerBail($demande, $d['jour_echeance'])
            : $request->user()->creerBail($demande);

        return response()->json($bail, Response::HTTP_CREATED);
    }

    /** Les mois du bail, ce qui est réglé et la prochaine échéance. */
    public function echeancier(Request $request, Bail $bail): JsonResponse
    {
        $this->exigerQue($bail->concerne($request->user()));
        $payes = $bail->paiementsLoyer()->where('statut', StatutPaiement::REUSSI)->count();

        return response()->json([
            'loyer_mensuel' => $bail->loyer_mensuel,
            'charges' => $bail->charges,
            'caution' => $bail->caution,
            'caution_payee' => $bail->paiementCaution()->exists(),
            'loyers_payes' => $payes,
            'loyers_total' => $bail->duree_mois,
            'prochaine_echeance' => $bail->prochaineEcheance()?->toDateString(),
            'date_fin' => $bail->dateFin()->toDateString(),
        ]);
    }

    public function resilier(Request $request, Bail $bail): JsonResponse
    {
        $this->exigerQue($bail->concerne($request->user()));
        $bail->resilier($request->validate(['motif' => ['required', 'string', 'max:1000']])['motif']);

        return response()->json($bail);
    }
}
