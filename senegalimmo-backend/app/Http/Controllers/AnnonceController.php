<?php

namespace App\Http\Controllers;

use App\Enums\StatutAnnonce;
use App\Enums\TypeTransaction;
use App\Models\Annonce;
use App\Models\Bien;
use App\Models\OptionPremium;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cas « Publier une annonce » (propriétaire, ou agent pour un bien assigné), étendu par
 * « Activer option premium », et « Gérer ses annonces ».
 */
class AnnonceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(Annonce::whereIn('bien_id', $this->biensGeres($request->user()))->with('bien.medias', 'optionPremium')->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $d = $request->validate([
            'bien_id' => ['required', 'uuid', 'exists:biens,id'],
            'type_transaction' => ['required', Rule::enum(TypeTransaction::class)],
            'prix' => ['required', 'integer', 'min:1'],
            'charges' => ['sometimes', 'integer', 'min:0'],
            'caution' => ['sometimes', 'integer', 'min:0'],
        ]);
        $bien = Bien::findOrFail($d['bien_id']);
        $this->exigerGestion($bien, $request->user());

        $annonce = $bien->proprietaire->publierAnnonce($bien, TypeTransaction::from($d['type_transaction']), $d['prix'], $d['charges'] ?? 0, $d['caution'] ?? 0);

        return response()->json($annonce, Response::HTTP_CREATED);
    }

    public function update(Request $request, Annonce $annonce): JsonResponse
    {
        $this->exigerGestion($annonce->bien, $request->user());
        $d = $request->validate(['prix' => ['required', 'integer', 'min:1'], 'description' => ['required', 'string', 'max:5000']]);
        $annonce->modifier($d['prix'], $d['description']);

        return response()->json($annonce->fresh('bien'));
    }

    public function suspendre(Request $request, Annonce $annonce): JsonResponse
    {
        $this->exigerGestion($annonce->bien, $request->user());
        $annonce->suspendre();

        return response()->json($annonce);
    }

    /** Le propriétaire remet en ligne une annonce qu'il a suspendue : elle repasse en modération. */
    public function reprendre(Request $request, Annonce $annonce): JsonResponse
    {
        $this->exigerGestion($annonce->bien, $request->user());
        $annonce->modifier($annonce->prix, $annonce->bien->description);

        return response()->json($annonce);
    }

    public function conclure(Request $request, Annonce $annonce): JsonResponse
    {
        $this->exigerGestion($annonce->bien, $request->user());
        $this->exigerQue($annonce->statut === StatutAnnonce::PUBLIEE, 'Seule une annonce publiée peut être conclue.');
        $annonce->marquerConclue();

        return response()->json($annonce);
    }

    public function optionsPremium(): JsonResponse
    {
        return response()->json(OptionPremium::where('active', true)->orderBy('prix')->get());
    }

    public function activerPremium(Request $request, Annonce $annonce): JsonResponse
    {
        $this->exigerGestion($annonce->bien, $request->user());
        $id = $request->validate(['option_premium_id' => ['required', 'uuid', 'exists:options_premium,id']])['option_premium_id'];
        $annonce->activerPremium(OptionPremium::findOrFail($id));

        return response()->json($annonce->fresh('optionPremium'));
    }
}
