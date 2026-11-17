<?php

namespace App\Http\Controllers;

use App\Enums\StatutBien;
use App\Enums\TypeBien;
use App\Models\Agent;
use App\Models\Bien;
use App\Models\Proprietaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cas « Enregistrer un bien » (propriétaire), qui inclut « Géolocaliser le bien »,
 * et « Consulter biens assignés » (agent), étendu par « Filtrer par statut ».
 */
class BienController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $compte = $request->user();
        $statut = $request->validate(['statut' => ['sometimes', Rule::enum(StatutBien::class)]])['statut'] ?? null;
        $statut = $statut !== null ? StatutBien::from($statut) : null;

        $biens = $compte instanceof Agent
            ? $compte->biensAssignes($statut)->load('medias', 'annonces')
            : $compte->biens()->with('medias', 'annonces')->when($statut, fn ($q) => $q->where('statut', $statut))->latest()->get();

        return response()->json($biens);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var Proprietaire $proprietaire */
        $proprietaire = $request->user();
        $bien = new Bien($request->validate($this->regles()));
        $proprietaire->enregistrerBien($bien);

        return response()->json($bien->fresh(), Response::HTTP_CREATED);
    }

    public function show(Request $request, Bien $bien): JsonResponse
    {
        $this->exigerGestion($bien, $request->user());

        return response()->json($bien->load('medias', 'annonces', 'mandats.agent:id,prenom,nom'));
    }

    /** Modifier le bien ; de nouvelles coordonnées ou une nouvelle adresse relancent la géolocalisation. */
    public function update(Request $request, Bien $bien): JsonResponse
    {
        $this->exigerGestion($bien, $request->user());
        $bien->fill($request->validate($this->regles(partiel: true)));
        if ($bien->isDirty(['adresse', 'quartier', 'ville']) && ! $bien->isDirty(['latitude', 'longitude'])) {
            $bien->fill(['latitude' => null, 'longitude' => null]);
        }
        $bien->save();
        $bien->geolocaliser();

        return response()->json($bien->fresh());
    }

    public function destroy(Request $request, Bien $bien): JsonResponse
    {
        $this->exigerQue($request->user()->is($bien->proprietaire), 'Seul le propriétaire retire son bien.');
        $this->exigerQue($bien->annonces()->doesntExist(), 'Un bien déjà annoncé ne se supprime pas : retirez-le.');
        $bien->medias->each->supprimer();
        $bien->delete();

        return response()->json(['message' => 'Bien supprimé.']);
    }

    /** @return array<string, list<mixed>> */
    private function regles(bool $partiel = false): array
    {
        $requis = $partiel ? 'sometimes' : 'required';

        return [
            'titre' => [$requis, 'string', 'max:150'],
            'description' => [$requis, 'string', 'max:5000'],
            'type' => [$requis, Rule::enum(TypeBien::class)],
            'surface' => [$requis, 'numeric', 'gt:0'],
            'nombre_pieces' => [$requis, 'integer', 'min:1'],
            'nombre_chambres' => [$requis, 'integer', 'min:0'],
            'meuble' => ['sometimes', 'boolean'],
            'adresse' => [$requis, 'string', 'max:255'],
            'quartier' => [$requis, 'string', 'max:100'],
            'ville' => [$requis, 'string', 'max:100'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90', 'required_with:longitude'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180', 'required_with:latitude'],
            'statut' => ['sometimes', Rule::in([StatutBien::BROUILLON->value, StatutBien::RETIRE->value, StatutBien::DISPONIBLE->value])],
        ];
    }
}
