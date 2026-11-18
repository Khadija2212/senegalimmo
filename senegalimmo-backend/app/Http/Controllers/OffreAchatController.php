<?php

namespace App\Http\Controllers;

use App\Models\Annonce;
use App\Models\Client;
use App\Models\OffreAchat;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cas « Soumettre une offre d'achat » (client) et « Gérer offres d'achat » (propriétaire),
 * étendu par « Accepter ou refuser offre » ; l'acceptation crée la promesse de vente.
 */
class OffreAchatController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $compte = $request->user();
        $requete = $compte instanceof Client
            ? $compte->offresAchat()
            : OffreAchat::whereHas('annonce', fn (Builder $q) => $q->whereIn('bien_id', $this->biensGeres($compte)));

        return response()->json($requete->with(['annonce.bien.medias', 'annonce.bien.proprietaire:id,prenom,nom', 'client:id,prenom,nom,telephone', 'promesseVente'])->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $d = $request->validate([
            'annonce_id' => ['required', 'uuid', 'exists:annonces,id'],
            'montant' => ['required', 'integer', 'min:1'],
            'message' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);
        $offre = $request->user()->soumettreOffre(Annonce::findOrFail($d['annonce_id']), $d['montant'], $d['message'] ?? null);

        return response()->json($offre, Response::HTTP_CREATED);
    }

    public function accepter(Request $request, OffreAchat $offre): JsonResponse
    {
        $this->exigerQue($request->user()->is($offre->annonce->bien->proprietaire), "Seul le propriétaire accepte une offre d'achat.");

        return response()->json($offre->accepter(), Response::HTTP_CREATED);
    }

    public function refuser(Request $request, OffreAchat $offre): JsonResponse
    {
        $this->exigerGestion($offre->annonce->bien, $request->user());
        $offre->refuser($request->validate(['motif' => ['required', 'string', 'max:1000']])['motif']);

        return response()->json($offre);
    }

    public function retirer(Request $request, OffreAchat $offre): JsonResponse
    {
        $this->exigerQue($offre->client_id === $request->user()->id);
        $offre->retirer();

        return response()->json($offre);
    }
}
