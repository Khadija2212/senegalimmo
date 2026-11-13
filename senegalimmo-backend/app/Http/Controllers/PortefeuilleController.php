<?php

namespace App\Http\Controllers;

use App\Models\DemandeRetrait;
use App\Models\MouvementPortefeuille;
use Illuminate\Http\Request;

class PortefeuilleController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['proprietaire', 'agence', 'agent'], true)) {
            return response()->json(['message' => 'Le portefeuille est réservé aux propriétaires et aux agents immobiliers.'], 403);
        }

        $retraits = DemandeRetrait::where('user_id', $user->id)->orderByDesc('id')->limit(30)->get();
        $retraits->each(fn ($r) => $r->setAttribute('a_preuve', !empty($r->getRawOriginal('preuve'))));

        return response()->json([
            'solde'      => (float) $user->solde_portefeuille,
            'minimum'    => (int) config('services.retrait.minimum'),
            'mouvements' => MouvementPortefeuille::where('user_id', $user->id)->orderByDesc('id')->limit(50)->get(),
            'retraits'   => $retraits,
        ]);
    }
}