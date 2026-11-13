<?php

namespace App\Http\Controllers;

use App\Models\Bien;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Notation;

class BienController extends Controller
{
    private function rules(): array
    {
        return [
            'titre'       => 'required|string|max:255',
            'description' => 'required|string',
            'type'        => 'required|in:appartement,villa,bureau,terrain,studio',
            'transaction' => 'required|in:location,vente',
            'prix'        => 'required|numeric|min:0',
            'surface'     => 'nullable|numeric|min:0',
            'chambres'    => 'nullable|integer|min:0',
            'salles_bain' => 'nullable|integer|min:0',
            'adresse'     => 'required|string|max:255',
            'quartier'    => 'required|string|max:255',
            'ville'       => 'required|string|max:255',
            'latitude'    => 'nullable|numeric|between:-90,90',
            'longitude'   => 'nullable|numeric|between:-180,180',
        ];
    }

     public function index(Request $request)
    {
        $user = $request->user();
        $query = Bien::query()->latest();

        if ($user->role === 'proprietaire') {
            $query->where('proprietaire_id', $user->id)
                ->with(['annonces' => fn ($q) => $q
                    ->latest()
                    ->select('id', 'bien_id', 'statut', 'motif_rejet', 'created_at')]);
        } else {
            $query->where('statut', 'disponible');
        }

        return response()->json($query->get());
    }
        // Recherche publique : accessible sans connexion
    public function publicIndex(Request $request)
    {
        $query = Bien::query()
            ->where('statut', 'disponible')
            ->whereHas('annonces', fn ($q) => $q->where('statut', 'publiee'))
            ->latest();
        if ($request->filled('q')) {
            $q = '%' . $request->q . '%';
            $query->where(function ($sub) use ($q) {
                $sub->where('titre', 'ilike', $q)
                    ->orWhere('quartier', 'ilike', $q)
                    ->orWhere('ville', 'ilike', $q)
                    ->orWhere('adresse', 'ilike', $q);
            });
        }

        if ($request->filled('transaction')) {
            $query->where('transaction', $request->transaction);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('prix_min')) {
            $query->where('prix', '>=', $request->prix_min);
        }

        if ($request->filled('prix_max')) {
            $query->where('prix', '<=', $request->prix_max);
        }

        if ($request->filled('lat') && $request->filled('lng')
            && is_numeric($request->lat) && is_numeric($request->lng)) {
            $lat = max(-90.0, min(90.0, (float) $request->lat));
            $lng = max(-180.0, min(180.0, (float) $request->lng));
            $rayonKm = is_numeric($request->rayon_km)
                ? max(1.0, min(200.0, (float) $request->rayon_km))
                : 10.0;

            // Pré-filtrage par boîte englobante compatible PostgreSQL et SQLite
            $latDelta = $rayonKm / 111.0;
            $cosLat = max(0.01, cos(deg2rad($lat)));
            $lngDelta = $rayonKm / (111.0 * $cosLat);

            $candidats = $query
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->whereBetween('latitude', [$lat - $latDelta, $lat + $latDelta])
                ->whereBetween('longitude', [$lng - $lngDelta, $lng + $lngDelta])
                ->get();

            $biensProches = $candidats
                ->map(function (Bien $bien) use ($lat, $lng) {
                    $distance = $this->haversineKm($lat, $lng, (float) $bien->latitude, (float) $bien->longitude);
                    $bien->setAttribute('distance_km', round($distance, 1));
                    return $bien;
                })
                ->filter(fn (Bien $bien) => $bien->getAttribute('distance_km') <= $rayonKm)
                ->sortBy('distance_km')
                ->take(60)
                ->values();

            return response()->json($biensProches);
        }

        return response()->json($query->limit(60)->get());
    }

    /**
     * Calcule la distance orthodromique en kilomètres entre deux coordonnées GPS.
     */
    private function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadiusKm = 6371.0;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $earthRadiusKm * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
        // Détail public d'un bien : accessible sans connexion
     public function publicShow(Bien $bien)
    {
        $annonce = $bien->annonces()->where('statut', 'publiee')->first();

        if ($bien->statut !== 'disponible' || !$annonce) {
            return response()->json(['message' => 'Bien introuvable.'], 404);
        }

        $annonce->increment('nombre_vues');
        $bien->load('proprietaire:id,nom,prenom');

        $avis = Notation::where('note_id', $bien->proprietaire_id);
        $bien->setAttribute('avis_total', (clone $avis)->count());
        $bien->setAttribute('avis_moyenne', round((float) (clone $avis)->avg('note'), 1));

        return response()->json($bien);
    }

    public function store(Request $request)
    {
        if ($request->user()->role !== 'proprietaire') {
            return response()->json(['message' => 'Action réservée aux propriétaires.'], 403);
        }

        $data = $request->validate($this->rules() + [
            'photos'   => 'nullable|array|max:5',
            'photos.*' => 'image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        $paths = [];
        foreach ($request->file('photos', []) as $photo) {
            $paths[] = $photo->store('biens', 'public');
        }

        $data['photos'] = $paths;
        $data['proprietaire_id'] = $request->user()->id;

        $bien = Bien::create($data);

        return response()->json($bien, 201);
    }

    public function show(Bien $bien)
    {
        return response()->json($bien);
    }

     public function update(Request $request, Bien $bien)
    {
        if ($bien->proprietaire_id !== $request->user()->id) {
            return response()->json(['message' => 'Ce bien ne vous appartient pas.'], 403);
        }

        $data = $request->validate($this->rules());
        $bien->update($data);

        // Garder les annonces en cours cohérentes avec le bien modifié
        $bien->annonces()
            ->whereIn('statut', ['en_attente', 'publiee'])
            ->update([
                'titre'            => $bien->titre,
                'description'      => $bien->description,
                'prix'             => $bien->prix,
                'type_transaction' => $bien->transaction,
            ]);

        return response()->json($bien);
    }
    // Ajouter des photos à un bien existant
    public function ajouterPhotos(Request $request, Bien $bien)
    {
        if ($bien->proprietaire_id !== $request->user()->id) {
            return response()->json(['message' => 'Ce bien ne vous appartient pas.'], 403);
        }

        $request->validate([
            'photos'   => 'required|array|min:1|max:5',
            'photos.*' => 'image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        $existantes = $bien->photos ?? [];
        $nouvelles = $request->file('photos', []);

        if (count($existantes) + count($nouvelles) > 5) {
            return response()->json(['message' => 'Un bien ne peut pas avoir plus de 5 photos.'], 422);
        }

        $chemins = [];
        foreach ($nouvelles as $photo) {
            $chemins[] = $photo->store('biens', 'public');
        }

        $bien->photos = array_merge($existantes, $chemins);
        $bien->save();

        return response()->json($bien->fresh());
    }

    // Supprimer une photo d'un bien
    public function supprimerPhoto(Request $request, Bien $bien)
    {
        if ($bien->proprietaire_id !== $request->user()->id) {
            return response()->json(['message' => 'Ce bien ne vous appartient pas.'], 403);
        }

        $data = $request->validate(['photo' => 'required|string']);

        $photos = $bien->photos ?? [];

        if (!in_array($data['photo'], $photos, true)) {
            return response()->json(['message' => 'Photo introuvable.'], 404);
        }

        Storage::disk('public')->delete($data['photo']);

        $bien->photos = array_values(array_diff($photos, [$data['photo']]));
        $bien->save();

        return response()->json($bien->fresh());
    }
    public function destroy(Request $request, Bien $bien)
    {
        if ($bien->proprietaire_id !== $request->user()->id) {
            return response()->json(['message' => 'Ce bien ne vous appartient pas.'], 403);
        }

        Storage::disk('public')->delete($bien->photos ?? []);
        $bien->delete();

        return response()->json(['message' => 'Bien supprimé.']);
    }
}