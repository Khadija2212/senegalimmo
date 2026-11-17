<?php

namespace App\Http\Controllers;

use App\Enums\TypeEtatDesLieux;
use App\Models\Bail;
use App\Models\EtatDesLieux;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/** Cas « Réaliser état des lieux » (propriétaire), qui inclut « Téléverser des photos » ; validation par le locataire. */
class EtatDesLieuxController extends Controller
{
    public function index(Request $request, Bail $bail): JsonResponse
    {
        $this->exigerQue($bail->concerne($request->user()));

        return response()->json($bail->etatsDesLieux()->with('photos')->get());
    }

    public function store(Request $request, Bail $bail): JsonResponse
    {
        $d = $request->validate([
            'type' => ['required', Rule::enum(TypeEtatDesLieux::class)],
            'observations' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'releve_compteurs' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'photos' => ['sometimes', 'array'],
            'photos.*' => ['uuid'],
        ]);
        $etat = $request->user()->realiserEtatDesLieux($bail, TypeEtatDesLieux::from($d['type']), $d['observations'] ?? null, $d['releve_compteurs'] ?? null, $d['photos'] ?? []);

        return response()->json($etat->load('photos'), Response::HTTP_CREATED);
    }

    public function valider(Request $request, EtatDesLieux $etat): JsonResponse
    {
        $this->exigerQue($etat->bail->locataire()->is($request->user()), "Seul le locataire valide l'état des lieux.");
        $etat->valider();

        return response()->json($etat);
    }
}
