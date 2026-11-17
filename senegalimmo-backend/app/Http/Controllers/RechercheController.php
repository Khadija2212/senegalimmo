<?php

namespace App\Http\Controllers;

use App\Enums\TypeBien;
use App\Enums\TypeTransaction;
use App\Models\Annonce;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

    public function rechercher(Request $request): JsonResponse
    {
        $tri = $request->validate(['tri' => ['sometimes', Rule::in(['recent', 'prix_asc', 'prix_desc'])]])['tri'] ?? 'recent';
        $requete = $this->filtrer($request)->with(['bien.medias'])
            ->orderByRaw('(premium_jusquau IS NOT NULL AND premium_jusquau > ?) DESC', [now()]);
        match ($tri) {
            'prix_asc' => $requete->orderBy('prix'),
            'prix_desc' => $requete->orderByDesc('prix'),
            default => $requete->orderByDesc('publiee_le'),
        };
        $requete->orderByDesc('annonces.id');

        return response()->json($requete->paginate(self::PAR_PAGE));
    }

    public function carte(Request $request): JsonResponse
    {
        $points = $this->filtrer($request)
            ->join('biens', 'biens.id', '=', 'annonces.bien_id')
            ->whereNotNull('biens.latitude')->whereNotNull('biens.longitude')
            ->limit(self::MAX_POINTS_CARTE)
            ->get(['annonces.id', 'annonces.reference', 'annonces.prix', 'annonces.type_transaction', 'biens.titre', 'biens.latitude', 'biens.longitude']);

        return response()->json($points);
    }

    public function comparer(Request $request): JsonResponse
    {
        $ids = $request->validate([
            'ids' => ['required', 'array', 'min:'.self::COMPARAISON_MIN, 'max:'.self::COMPARAISON_MAX],
            'ids.*' => ['uuid', 'distinct'],
        ])['ids'];

        return response()->json(Annonce::publiees()->with('bien.medias')->whereIn('id', $ids)->get());
    }

    public function consulter(Annonce $annonce): JsonResponse
    {
        $annonce->exigerOuverte();
        $annonce->compterVue();

        return response()->json($annonce->load(['bien.medias', 'bien.proprietaire:id,prenom,nom,identite_verifiee']));
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
        ]);

        return Annonce::publiees()
            ->when(isset($f['type_transaction']), fn (Builder $q) => $q->where('annonces.type_transaction', $f['type_transaction']))
            ->when(isset($f['prix_min']), fn (Builder $q) => $q->where('annonces.prix', '>=', $f['prix_min']))
            ->when(isset($f['prix_max']), fn (Builder $q) => $q->where('annonces.prix', '<=', $f['prix_max']))
            ->whereHas('bien', fn (Builder $b) => $b
                ->when(isset($f['type']), fn (Builder $q) => $q->where('type', $f['type']))
                ->when(isset($f['ville']), fn (Builder $q) => $q->where('ville', 'ilike', $f['ville']))
                ->when(isset($f['quartier']), fn (Builder $q) => $q->where('quartier', 'ilike', $f['quartier']))
                ->when(isset($f['chambres_min']), fn (Builder $q) => $q->where('nombre_chambres', '>=', $f['chambres_min']))
                ->when(isset($f['surface_min']), fn (Builder $q) => $q->where('surface', '>=', $f['surface_min']))
                ->when(isset($f['meuble']), fn (Builder $q) => $q->where('meuble', $request->boolean('meuble')))
                ->when(isset($f['q']), fn (Builder $q) => $q->where(fn (Builder $t) => $t->where('titre', 'ilike', '%'.$f['q'].'%')->orWhere('description', 'ilike', '%'.$f['q'].'%'))));
    }
}
