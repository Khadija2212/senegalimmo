<?php

namespace App\Http\Controllers;

use App\Models\Bien;
use App\Models\Favori;
use Illuminate\Http\Request;

class FavoriController extends Controller
{
    // Liste des biens favoris de l'utilisateur connecté
    public function index(Request $request)
    {
        $user = $request->user();

        $favoris = Favori::with('bien.proprietaire:id,nom,prenom')
            ->where('user_id', $user->id)
            ->latest()
            ->get()
            ->pluck('bien')
            ->filter();

        return response()->json($favoris->values());
    }

    // Récupérer uniquement la liste des IDs des biens favoris
    public function ids(Request $request)
    {
        $ids = Favori::where('user_id', $request->user()->id)
            ->pluck('bien_id')
            ->map(fn ($id) => (int) $id)
            ->values();

        return response()->json($ids);
    }

    // Ajouter ou retirer un bien des favoris (toggle)
    public function toggle(Request $request)
    {
        $data = $request->validate([
            'bien_id' => 'required|exists:biens,id',
        ]);

        $user = $request->user();
        $favori = Favori::where('user_id', $user->id)
            ->where('bien_id', $data['bien_id'])
            ->first();

        if ($favori) {
            $favori->delete();
            return response()->json(['message' => 'Retiré des favoris', 'est_favori' => false]);
        }

        Favori::create([
            'user_id' => $user->id,
            'bien_id' => $data['bien_id'],
        ]);

        return response()->json(['message' => 'Ajouté aux favoris', 'est_favori' => true]);
    }
}
