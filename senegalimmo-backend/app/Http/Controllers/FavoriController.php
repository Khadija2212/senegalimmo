<?php

namespace App\Http\Controllers;

use App\Models\Annonce;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Cas « Sauvegarder en favoris » (association Client 0..* Annonce 0..*). */
class FavoriController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json($request->user()->favoris()->with('bien.medias')->get());
    }

    public function store(Request $request, Annonce $annonce): JsonResponse
    {
        $request->user()->ajouterFavori($annonce);

        return response()->json(['message' => 'Annonce ajoutée aux favoris.']);
    }

    public function destroy(Request $request, Annonce $annonce): JsonResponse
    {
        $request->user()->retirerFavori($annonce);

        return response()->json(['message' => 'Annonce retirée des favoris.']);
    }
}
