<?php

namespace App\Http\Controllers;

use App\Models\Alerte;
use Illuminate\Http\Request;

class AlerteController extends Controller
{
    public function index(Request $request)
    {
        $id = $request->user()->id;

        return response()->json([
            'non_lues' => Alerte::where('user_id', $id)->where('lue', false)->count(),
            'alertes'  => Alerte::where('user_id', $id)->orderByDesc('created_at')->orderByDesc('id')->limit(50)->get(),
        ]);
    }

    public function lire(Request $request, Alerte $alerte)
    {
        if ($alerte->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $alerte->update(['lue' => true]);

        return response()->json($alerte);
    }

    public function lireTout(Request $request)
    {
        Alerte::where('user_id', $request->user()->id)->where('lue', false)->update(['lue' => true]);

        return response()->json(['message' => 'Toutes les alertes sont lues.']);
    }
}