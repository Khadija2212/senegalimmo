<?php

namespace App\Http\Controllers;

use App\Contracts\ServiceSignature;
use App\Contracts\ServiceStockage;
use App\Models\Agent;
use App\Models\Bail;
use App\Models\Client;
use App\Models\Compte;
use App\Models\Contrat;
use App\Models\Mandat;
use App\Models\PromesseVente;
use App\Models\Signature;
use App\Services\Signature\SignatureElectroniqueSimple;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Cas « Consulter son bail », « Signer le bail », « Signer la promesse de vente » et
 * « Signer le contrat » du mandat, qui incluent « Signature électronique » («use» ServiceSignature).
 */
class ContratController extends Controller
{
    private const DUREE_LIEN_MIN = 15;

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->contratsDe($request->user())->map(fn (Contrat $c) => $this->presenter($c))->values());
    }

    public function show(Request $request, Contrat $contrat): JsonResponse
    {
        $this->exigerQue($contrat->concerne($request->user()));

        return response()->json($this->presenter($contrat));
    }

    public function document(Request $request, Contrat $contrat): JsonResponse
    {
        $this->exigerQue($contrat->concerne($request->user()));
        $url = $contrat->document_url ?? $contrat->genererDocument();

        return response()->json(['url' => app(ServiceStockage::class)->urlSignee($url, self::DUREE_LIEN_MIN)]);
    }

    /** Le signataire connecté appose sa signature ; à la dernière, le contrat devient signé. */
    public function signer(Request $request, Contrat $contrat, ServiceSignature $service): JsonResponse
    {
        $this->exigerQue($service instanceof SignatureElectroniqueSimple, 'La signature se fait chez le prestataire de signature.');
        $signature = $contrat->signatures()->where('signataire_id', $request->user()->id)->first();
        $this->exigerQue($signature !== null, 'Ce contrat ne vous demande pas de signature.');

        $service->signer($signature, $request->user(), (string) $request->ip());
        $contrat->actualiserSignatures();

        return response()->json($this->presenter($contrat->fresh()));
    }

    public function relancer(Request $request, Signature $signature): JsonResponse
    {
        $this->exigerQue($signature->contrat->concerne($request->user()));
        $signature->relancer();

        return response()->json(['message' => 'Le signataire a été relancé.']);
    }

    /** @return Collection<int, Contrat> */
    private function contratsDe(Compte $c): Collection
    {
        $requetes = match (true) {
            $c instanceof Client => [$c->baux(), $c->promesses()],
            $c instanceof Agent => [$c->mandats()->getQuery()],
            default => [
                Bail::whereHas('demandeLocation.annonce.bien', fn ($q) => $q->where('proprietaire_id', $c->id)),
                PromesseVente::whereHas('offreAchat.annonce.bien', fn ($q) => $q->where('proprietaire_id', $c->id)),
                Mandat::whereHas('bien', fn ($q) => $q->where('proprietaire_id', $c->id)),
            ],
        };

        return (new Collection(array_merge(...array_map(fn ($q) => $q->get()->all(), $requetes))))->sortByDesc('created_at');
    }

    /** @return array<string, mixed> */
    private function presenter(Contrat $c): array
    {
        $bien = $c->bienConcerne();

        return $c->toArray() + [
            'bien' => $bien->only(['id', 'titre', 'adresse', 'quartier', 'ville']),
            'signatures' => $c->signatures()->with('signataire:id,prenom,nom,role')->get(),
            'signe_par_tous' => $c->estSigneParTous(),
        ];
    }
}
