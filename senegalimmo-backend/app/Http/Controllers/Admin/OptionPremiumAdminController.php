<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OptionPremium;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Cas « Gérer options premium ». */
class OptionPremiumAdminController extends Controller
{
    private const DUREE_MAX_JOURS = 365;

    public function index(): JsonResponse
    {
        return response()->json(OptionPremium::orderBy('prix')->get());
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json(OptionPremium::create($request->validate($this->regles())), Response::HTTP_CREATED);
    }

    public function update(Request $request, OptionPremium $option): JsonResponse
    {
        $option->update($request->validate($this->regles(partiel: true)));

        return response()->json($option);
    }

    /** @return array<string, list<string>> */
    private function regles(bool $partiel = false): array
    {
        $requis = $partiel ? 'sometimes' : 'required';

        return [
            'libelle' => [$requis, 'string', 'max:100'],
            'duree_jours' => [$requis, 'integer', 'min:1', 'max:'.self::DUREE_MAX_JOURS],
            'prix' => [$requis, 'integer', 'min:0'],
            'active' => ['sometimes', 'boolean'],
        ];
    }
}
