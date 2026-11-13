<?php

namespace App\Http\Controllers;

use App\Models\Bien;
use App\Models\Signalement;
use Illuminate\Http\Request;

class SignalementController extends Controller
{
    // Admin : liste tous les signalements
    public function index(Request $request)
    {
        if ($request->user()->role !== 'administrateur') {
            return response()->json(['message' => 'Accès réservé à l\'administrateur.'], 403);
        }

        $signalements = Signalement::with([
            'user:id,nom,prenom,email,telephone',
            'bien:id,titre,prix,statut,proprietaire_id',
            'bien.proprietaire:id,nom,prenom,telephone',
        ])
            ->latest()
            ->get();

        return response()->json($signalements);
    }

    // Utilisateur : signaler un bien suspect
    public function store(Request $request)
    {
        $data = $request->validate([
            'bien_id'     => 'required|exists:biens,id',
            'motif'       => 'required|string|max:255',
            'description' => 'nullable|string|max:1500',
        ]);

        $signalement = Signalement::create([
            'user_id'     => $request->user()->id,
            'bien_id'     => $data['bien_id'],
            'motif'       => $data['motif'],
            'description' => $data['description'] ?? null,
            'statut'      => 'en_attente',
        ]);

        return response()->json([
            'message'     => 'Votre signalement a été enregistré et sera examiné par l\'administrateur.',
            'signalement' => $signalement,
        ], 201);
    }

    // Admin : traiter ou rejeter un signalement
    public function update(Request $request, Signalement $signalement)
    {
        if ($request->user()->role !== 'administrateur') {
            return response()->json(['message' => 'Accès réservé à l\'administrateur.'], 403);
        }

        $data = $request->validate([
            'statut'        => 'required|in:traite,rejete',
            'reponse_admin' => 'nullable|string|max:1000',
        ]);

        $signalement->update([
            'statut'        => $data['statut'],
            'reponse_admin' => $data['reponse_admin'] ?? null,
        ]);

        return response()->json([
            'message'     => 'Signalement mis à jour.',
            'signalement' => $signalement,
        ]);
    }
}
