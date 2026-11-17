<?php

namespace App\Http\Controllers;

use App\Models\Agent;
use App\Models\Commission;
use App\Models\Mandat;
use App\Models\Visite;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'agent') {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return response()->json([]);
    }

    public function store(Request $request)
    {
        return response()->json([
            'message' => 'La création de sous-agents par agence a été supprimée : chaque agent immobilier dispose de son propre compte.',
        ], 403);
    }

    // Désactivé : rôle agence fusionné avec agent immobilier
    public function statut(Request $request, Agent $agent)
    {
        return response()->json([
            'message' => 'La gestion de sous-agents par agence a été supprimée.',
        ], 403);
    }
}