<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Exceptions\OperationRefusee;
use App\Models\Compte;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Symfony\Component\HttpFoundation\Response;

/** Cas « S'inscrire » et « S'authentifier ». */
class AuthController extends Controller
{
    private const LONGUEUR_MIN_MOT_DE_PASSE = 8;

    public function inscrire(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'prenom' => ['required', 'string', 'max:100'],
            'nom' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'telephone' => ['required', 'string', 'regex:/^\+?[0-9 ]{9,15}$/'],
            'password' => ['required', 'confirmed', Password::min(self::LONGUEUR_MIN_MOT_DE_PASSE)],
            'role' => ['required', Rule::in(Role::inscriptibles())],
        ]);
        $classe = Compte::sousClasses()[$donnees['role']];
        $compte = $classe::create(collect($donnees)->except('role')->all());

        return response()->json(['user' => $compte->fresh(), 'token' => $compte->sAuthentifier($donnees['email'], $donnees['password'])], Response::HTTP_CREATED);
    }

    public function connecter(Request $request): JsonResponse
    {
        $donnees = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);
        $compte = Compte::tous()->whereRaw('lower(email) = ?', [mb_strtolower($donnees['email'])])->first()
            ?? throw new OperationRefusee('Adresse e-mail ou mot de passe incorrect.', OperationRefusee::NON_AUTHENTIFIE);
        $jeton = $compte->sAuthentifier($donnees['email'], $donnees['password']);

        return response()->json(['user' => $compte->fresh(), 'token' => $jeton]);
    }

    public function deconnecter(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    public function moi(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
