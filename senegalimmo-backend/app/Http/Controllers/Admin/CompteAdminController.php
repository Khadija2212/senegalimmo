<?php

namespace App\Http\Controllers\Admin;

use App\Contracts\ServiceStockage;
use App\Enums\Role;
use App\Enums\StatutCompte;
use App\Http\Controllers\Controller;
use App\Models\Agent;
use App\Models\Compte;
use App\Models\Proprietaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Cas « Gérer les utilisateurs » et « Valider les agents ». */
class CompteAdminController extends Controller
{
    private const PAR_PAGE = 30;

    private const DUREE_LIEN_MIN = 15;

    public function index(Request $request): JsonResponse
    {
        $f = $request->validate([
            'role' => ['sometimes', Rule::enum(Role::class)],
            'statut' => ['sometimes', Rule::enum(StatutCompte::class)],
            'q' => ['sometimes', 'string', 'max:100'],
        ]);
        $requete = Compte::tous()
            ->when(isset($f['role']), fn ($q) => $q->where('role', $f['role']))
            ->when(isset($f['statut']), fn ($q) => $q->where('statut', $f['statut']))
            ->when(isset($f['q']), fn ($q) => $q->where(fn ($t) => $t->where('nom', 'ilike', '%'.$f['q'].'%')->orWhere('prenom', 'ilike', '%'.$f['q'].'%')->orWhere('email', 'ilike', '%'.$f['q'].'%')));

        return response()->json($requete->latest()->paginate(self::PAR_PAGE));
    }

    public function suspendre(Request $request, Compte $compte): JsonResponse
    {
        $request->user()->suspendreCompte($compte);

        return response()->json($compte->fresh());
    }

    public function reactiver(Request $request, Compte $compte): JsonResponse
    {
        $request->user()->reactiverCompte($compte);

        return response()->json($compte->fresh());
    }

    public function validerAgent(Request $request, Agent $agent): JsonResponse
    {
        $accepte = $request->validate(['accepte' => ['required', 'boolean']])['accepte'];
        $request->user()->validerAgent($agent, (bool) $accepte);

        return response()->json($agent->fresh());
    }

    /** Vérifier l'identité d'un propriétaire, préalable au badge vérifié de ses annonces. */
    public function verifierIdentite(Request $request, Proprietaire $proprietaire): JsonResponse
    {
        $request->user()->verifierIdentite($proprietaire);

        return response()->json($proprietaire->fresh());
    }

    public function pieceIdentite(Compte $compte, ServiceStockage $stockage): JsonResponse
    {
        $this->exigerQue($compte->piece_identite_url !== null, "Aucune pièce d'identité envoyée.");

        return response()->json(['url' => $stockage->urlSignee($compte->piece_identite_url, self::DUREE_LIEN_MIN)]);
    }
}
