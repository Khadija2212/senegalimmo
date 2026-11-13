<?php

namespace App\Http\Controllers;

use App\Models\Categorie;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategorieController extends Controller
{
    // Public : lister les catégories
    public function index()
    {
        return response()->json(Categorie::withCount('biens')->get());
    }

    // Admin : créer une catégorie
    public function store(Request $request)
    {
        if ($request->user()->role !== 'administrateur') {
            return response()->json(['message' => 'Accès réservé à l\'administrateur.'], 403);
        }

        $data = $request->validate([
            'nom'         => 'required|string|max:255|unique:categories,nom',
            'description' => 'nullable|string|max:500',
            'icone'       => 'nullable|string|max:100',
        ]);

        $data['slug'] = Str::slug($data['nom']);

        $categorie = Categorie::create($data);

        return response()->json($categorie, 201);
    }

    // Admin : modifier une catégorie
    public function update(Request $request, Categorie $categorie)
    {
        if ($request->user()->role !== 'administrateur') {
            return response()->json(['message' => 'Accès réservé à l\'administrateur.'], 403);
        }

        $data = $request->validate([
            'nom'         => 'required|string|max:255|unique:categories,nom,' . $categorie->id,
            'description' => 'nullable|string|max:500',
            'icone'       => 'nullable|string|max:100',
        ]);

        $data['slug'] = Str::slug($data['nom']);
        $categorie->update($data);

        return response()->json($categorie);
    }

    // Admin : supprimer une catégorie
    public function destroy(Request $request, Categorie $categorie)
    {
        if ($request->user()->role !== 'administrateur') {
            return response()->json(['message' => 'Accès réservé à l\'administrateur.'], 403);
        }

        $categorie->delete();

        return response()->json(['message' => 'Catégorie supprimée.']);
    }
}
