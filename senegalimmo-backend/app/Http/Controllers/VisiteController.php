<?php

namespace App\Http\Controllers;

use App\Enums\NiveauInteret;
use App\Models\Annonce;
use App\Models\Client;
use App\Models\Visite;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cas « Demander une visite » (client) et « Gérer les visites » (propriétaire, agent),
 * étendu par « Confirmer ou refuser une visite » ; « Créer compte-rendu de visite » (agent).
 */
class VisiteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $compte = $request->user();
        $requete = $compte instanceof Client
            ? $compte->visites()
            : Visite::whereHas('annonce', fn (Builder $q) => $q->whereIn('bien_id', $this->biensGeres($compte)));

        // Le compte rendu de l'agent est une note de travail : le client ne le reçoit pas.
        $relations = ['annonce.bien.medias', 'annonce.bien.proprietaire:id,prenom,nom', 'client:id,prenom,nom,telephone'];
        $visites = $requete->with($compte instanceof Client ? $relations : [...$relations, 'compteRendu'])
            ->orderBy('date_heure')->get();

        // L'agent mandaté, s'il y en a un, est celui qui confirme la visite.
        return response()->json($visites->map(fn (Visite $v) => [
            ...$v->toArray(),
            'agent' => $v->annonce->bien->mandatActif()?->agent?->only(['id', 'prenom', 'nom', 'agence']),
        ]));
    }

    public function store(Request $request): JsonResponse
    {
        $d = $request->validate(['annonce_id' => ['required', 'uuid', 'exists:annonces,id'], 'date_heure' => ['required', 'date']]);
        $visite = $request->user()->demanderVisite(Annonce::findOrFail($d['annonce_id']), Carbon::parse($d['date_heure']));

        return response()->json($visite, Response::HTTP_CREATED);
    }

    public function confirmer(Request $request, Visite $visite): JsonResponse
    {
        $this->exigerGestion($visite->annonce->bien, $request->user());
        $visite->confirmer();

        return response()->json($visite);
    }

    public function refuser(Request $request, Visite $visite): JsonResponse
    {
        $this->exigerGestion($visite->annonce->bien, $request->user());
        $visite->refuser($request->validate(['motif' => ['required', 'string', 'max:1000']])['motif']);

        return response()->json($visite);
    }

    public function annuler(Request $request, Visite $visite): JsonResponse
    {
        $this->exigerPartie($visite, $request);
        $visite->annuler();

        return response()->json($visite);
    }

    public function reprogrammer(Request $request, Visite $visite): JsonResponse
    {
        $this->exigerPartie($visite, $request);
        $visite->reprogrammer(Carbon::parse($request->validate(['date_heure' => ['required', 'date']])['date_heure']));

        return response()->json($visite);
    }

    public function compteRendu(Request $request, Visite $visite): JsonResponse
    {
        $d = $request->validate(['contenu' => ['required', 'string', 'max:5000'], 'interet_client' => ['required', Rule::enum(NiveauInteret::class)]]);
        $cr = $request->user()->creerCompteRendu($visite, $d['contenu'], NiveauInteret::from($d['interet_client']));

        return response()->json($cr, Response::HTTP_CREATED);
    }

    private function exigerPartie(Visite $visite, Request $request): void
    {
        $compte = $request->user();
        $this->exigerQue($visite->client_id === $compte->id || $visite->annonce->bien->estGerePar($compte));
    }
}
