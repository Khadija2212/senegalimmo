<?php

namespace App\Http\Controllers;

use App\Enums\TypeBien;
use App\Enums\TypeTransaction;
use App\Models\Annonce;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Cas du visiteur : « Rechercher un bien », étendu par « Filtrer par critères »,
 * « Comparer des biens » et « Afficher sur la carte » ; puis « Consulter une annonce ».
 */
class RechercheController extends Controller
{
    private const PAR_PAGE = 12;

    private const MAX_POINTS_CARTE = 500;

    private const COMPARAISON_MIN = 2;

    private const COMPARAISON_MAX = 4;

    private const RAYON_DEFAUT_KM = 3;

    private const RAYON_MAX_KM = 50;

    private const KM_PAR_DEGRE = 111.32;

    /** Ce que paie le client : le prix, plus les charges pour une location (nulles pour une vente). */
    private const COUT_MENSUEL = '(annonces.prix + annonces.charges)';

    public function rechercher(Request $request): JsonResponse
    {
        $tri = $request->validate(['tri' => ['sometimes', Rule::in(['recent', 'prix_asc', 'prix_desc'])]])['tri'] ?? 'recent';
        $requete = $this->filtrer($request)->with(['bien.medias'])
            ->orderByRaw('(premium_jusquau IS NOT NULL AND premium_jusquau > ?) DESC', [now()]);
        match ($tri) {
            'prix_asc' => $requete->orderByRaw(self::COUT_MENSUEL),
            'prix_desc' => $requete->orderByRaw(self::COUT_MENSUEL.' DESC'),
            default => $requete->orderByDesc('publiee_le'),
        };
        $requete->orderByDesc('annonces.id');

        return response()->json([...$requete->paginate(self::PAR_PAGE)->toArray(), 'resume' => $this->resume($request)]);
    }

    public function carte(Request $request): JsonResponse
    {
        $points = $this->filtrer($request)
            ->join('biens', 'biens.id', '=', 'annonces.bien_id')
            ->whereNotNull('biens.latitude')->whereNotNull('biens.longitude')
            ->limit(self::MAX_POINTS_CARTE)
            ->get(['annonces.id', 'annonces.reference', 'annonces.prix', 'annonces.charges', 'annonces.type_transaction', 'biens.titre', 'biens.latitude', 'biens.longitude']);

        return response()->json($points);
    }

    public function comparer(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ids' => ['required', 'array', 'min:'.self::COMPARAISON_MIN, 'max:'.self::COMPARAISON_MAX],
            'ids.*' => ['uuid', 'distinct'],
        ])['ids'];

        return response()->json(Annonce::publiees()->with(['bien.medias', 'bien.proprietaire:id,prenom,nom'])->whereIn('id', $ids)->get());
    }

    public function consulter(Annonce $annonce): JsonResponse
    {
        $annonce->exigerOuverte();
        $annonce->compterVue();
        $annonce->load(['bien.medias', 'bien.proprietaire:id,prenom,nom,identite_verifiee']);
        $agent = $annonce->bien->mandatActif()?->agent;

        return response()->json([...$annonce->toArray(), 'agent' => $agent?->only(['id', 'prenom', 'nom', 'agence'])]);
    }

    /** Critères du cas « Filtrer par critères ». */
    private function filtrer(Request $request): Builder
    {
        $f = $request->validate([
            'type_transaction' => ['sometimes', Rule::enum(TypeTransaction::class)],
            'type' => ['sometimes', Rule::enum(TypeBien::class)],
            'ville' => ['sometimes', 'string', 'max:100'],
            'quartier' => ['sometimes', 'string', 'max:100'],
            'prix_min' => ['sometimes', 'integer', 'min:0'],
            'prix_max' => ['sometimes', 'integer', 'min:0'],
            'chambres_min' => ['sometimes', 'integer', 'min:0'],
            'surface_min' => ['sometimes', 'numeric', 'min:0'],
            'meuble' => ['sometimes', 'boolean'],
            'q' => ['sometimes', 'string', 'max:100'],
            'lat' => ['required_with:lng', 'numeric', 'between:-90,90'],
            'lng' => ['required_with:lat', 'numeric', 'between:-180,180'],
            'rayon_km' => ['sometimes', 'numeric', 'min:0.5', 'max:'.self::RAYON_MAX_KM],
        ]);

        return Annonce::publiees()
            ->when(isset($f['type_transaction']), fn (Builder $q) => $q->where('annonces.type_transaction', $f['type_transaction']))
            ->when(isset($f['prix_min']), fn (Builder $q) => $q->whereRaw(self::COUT_MENSUEL.' >= ?', [$f['prix_min']]))
            ->when(isset($f['prix_max']), fn (Builder $q) => $q->whereRaw(self::COUT_MENSUEL.' <= ?', [$f['prix_max']]))
            ->whereHas('bien', fn (Builder $b) => $b
                ->when(isset($f['type']), fn (Builder $q) => $q->where('type', $f['type']))
                ->when(isset($f['ville']), fn (Builder $q) => $q->where('ville', 'ilike', $f['ville']))
                ->when(isset($f['quartier']), fn (Builder $q) => $q->where('quartier', 'ilike', $f['quartier']))
                ->when(isset($f['chambres_min']), fn (Builder $q) => $q->where('nombre_chambres', '>=', $f['chambres_min']))
                ->when(isset($f['surface_min']), fn (Builder $q) => $q->where('surface', '>=', $f['surface_min']))
                ->when(isset($f['meuble']), fn (Builder $q) => $q->where('meuble', $request->boolean('meuble')))
                ->when(isset($f['q']), fn (Builder $q) => $q->where(fn (Builder $t) => $t->where('titre', 'ilike', '%'.$f['q'].'%')->orWhere('description', 'ilike', '%'.$f['q'].'%')))
                ->when(isset($f['lat']), fn (Builder $q) => $this->autourDe($q, (float) $f['lat'], (float) $f['lng'], (float) ($f['rayon_km'] ?? self::RAYON_DEFAUT_KM))));
    }

    /** Zone carrée autour d'un point, pour « Autour de moi ». */
    private function autourDe(Builder $bien, float $lat, float $lng, float $rayonKm): Builder
    {
        $dLat = $rayonKm / self::KM_PAR_DEGRE;
        $dLng = $rayonKm / (self::KM_PAR_DEGRE * max(cos(deg2rad($lat)), 0.01));

        return $bien->whereBetween('latitude', [$lat - $dLat, $lat + $dLat])->whereBetween('longitude', [$lng - $dLng, $lng + $dLng]);
    }

    /** Résumé de la recherche : annonces vérifiées et prix le plus bas, sur tous les résultats. */
    private function resume(Request $request): array
    {
        $resultats = $this->filtrer($request);

        return [
            'verifiees' => (clone $resultats)->where('annonces.badge_verifie', true)->count(),
            'prix_min' => (clone $resultats)->min(DB::raw(self::COUT_MENSUEL)),
        ];
    }
}
