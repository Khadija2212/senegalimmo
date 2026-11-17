<?php

namespace App\Http\Controllers;

use App\Enums\MotifSignalement;
use App\Models\Annonce;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

/** Cas « Signaler un problème » (client), qui inclut « Notifier le propriétaire ». */
class SignalementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json($request->user()->signalements()->with('annonce.bien:id,titre')->latest()->get());
    }

    public function store(Request $request): JsonResponse
    {
        $d = $request->validate([
            'annonce_id' => ['sometimes', 'nullable', 'uuid', 'exists:annonces,id'],
            'motif' => ['required', Rule::enum(MotifSignalement::class)],
            'description' => ['required', 'string', 'max:3000'],
        ]);
        $annonce = isset($d['annonce_id']) ? Annonce::findOrFail($d['annonce_id']) : null;
        $signalement = $request->user()->signalerProbleme($annonce, MotifSignalement::from($d['motif']), $d['description']);

        return response()->json($signalement, Response::HTTP_CREATED);
    }
}
