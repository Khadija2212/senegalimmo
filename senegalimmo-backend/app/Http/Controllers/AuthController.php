<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Exceptions\OperationRefusee;
use App\Models\Compte;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cas « S'inscrire » et « S'authentifier ».
 * Le site SénégalImmo reçoit une session dans un cookie httpOnly ; les autres clients reçoivent un jeton.
 */
class AuthController extends Controller
{
    private const LONGUEUR_MIN_MOT_DE_PASSE = 8;

    private const GARDE_SESSION = 'web';

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

        return response()->json($this->ouvrirSession($request, $compte, $donnees['email'], $donnees['password']), Response::HTTP_CREATED);
    }

    public function connecter(Request $request): JsonResponse
    {
        $donnees = $request->validate(['email' => ['required', 'email'], 'password' => ['required', 'string']]);
        $compte = Compte::tous()->whereRaw('lower(email) = ?', [mb_strtolower($donnees['email'])])->first()
            ?? throw new OperationRefusee('Adresse e-mail ou mot de passe incorrect.', OperationRefusee::NON_AUTHENTIFIE);

        return response()->json($this->ouvrirSession($request, $compte, $donnees['email'], $donnees['password']));
    }

    public function deconnecter(Request $request): JsonResponse
    {
        if ($this->depuisLeSite($request)) {
            Auth::guard(self::GARDE_SESSION)->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        } else {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json(['message' => 'Déconnexion réussie.']);
    }

    /** Session pour le site (aucun jeton lisible par la page), jeton pour les autres clients. */
    private function ouvrirSession(Request $request, Compte $compte, string $email, string $motDePasse): array
    {
        if (! $this->depuisLeSite($request)) {
            return ['user' => $compte->fresh(), 'token' => $compte->sAuthentifier($email, $motDePasse)];
        }
        $compte->verifierIdentifiants($email, $motDePasse);
        Auth::guard(self::GARDE_SESSION)->login($compte);
        $request->session()->regenerate();

        return ['user' => $compte->fresh()];
    }

    private function depuisLeSite(Request $request): bool
    {
        return EnsureFrontendRequestsAreStateful::fromFrontend($request);
    }

    public function moi(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }
}
