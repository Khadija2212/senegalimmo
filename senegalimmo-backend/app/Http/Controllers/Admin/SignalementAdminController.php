<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StatutSignalement;
use App\Http\Controllers\Controller;
use App\Models\Signalement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Cas « Traiter les signalements », qui inclut « Notifier les parties ». */
class SignalementAdminController extends Controller
{
    private const PAR_PAGE = 30;

    public function index(Request $request): JsonResponse
    {
        $statut = $request->validate(['statut' => ['sometimes', Rule::enum(StatutSignalement::class)]])['statut'] ?? StatutSignalement::OUVERT->value;

        return response()->json(Signalement::where('statut', $statut)
            ->with('client:id,prenom,nom', 'annonce.bien:id,titre')->oldest()->paginate(self::PAR_PAGE));
    }

    public function traiter(Request $request, Signalement $signalement): JsonResponse
    {
        $resolution = $request->validate(['resolution' => ['required', 'string', 'max:3000']])['resolution'];
        $request->user()->traiterSignalement($signalement, $resolution);

        return response()->json($signalement);
    }
}
