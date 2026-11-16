<?php

namespace App\Http\Controllers;

use App\Enums\MethodePaiement;
use App\Enums\StatutRetrait;
use App\Models\Retrait;
use App\Services\Paiement\GestionRetraits;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class RetraitController extends Controller
{
    private const ADMIN = 'administrateur';
    private const LIMITE_ADMIN = 200;
    private const DECISION_APPROUVER = 'approuver';
    private const DECISION_REJETER = 'rejeter';

    public function __construct(private readonly GestionRetraits $retraits)
    {
    }

    /** Cas « Demander un retrait » : le montant est bloqué tout de suite. */
    public function demander(Request $request): JsonResponse
    {
        $data = $request->validate([
            'montant' => ['required', 'integer', 'min:1'],
            'methode' => ['required', Rule::in([MethodePaiement::WAVE->value, MethodePaiement::ORANGE_MONEY->value, MethodePaiement::FREE_MONEY->value])],
            'numero_beneficiaire' => ['required', 'string', 'regex:/^[0-9+ ]{7,20}$/'],
        ], ['numero_beneficiaire.regex' => 'Le numéro doit contenir 7 à 20 chiffres.']);

        $retrait = $this->retraits->demander(
            $request->user(),
            (int) $data['montant'],
            MethodePaiement::from($data['methode']),
            str_replace(' ', '', $data['numero_beneficiaire']),
        );

        return response()->json($retrait, Response::HTTP_CREATED);
    }

    /** Liste de l'administrateur : les demandes à traiter d'abord. */
    public function adminIndex(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === self::ADMIN, Response::HTTP_FORBIDDEN, 'Accès refusé.');

        $requete = Retrait::with(['portefeuille.user:id,nom,prenom,role,telephone', 'validateur:id,nom,prenom'])
            ->orderByRaw('case when statut = ? then 0 else 1 end', [StatutRetrait::DEMANDE->value])
            ->orderByDesc('id')
            ->limit(self::LIMITE_ADMIN);
        if ($request->filled('statut')) {
            $requete->where('statut', (string) $request->input('statut'));
        }

        return response()->json($requete->get());
    }

    /** Cas « Valider les retraits », étendu par « Verser les fonds ». */
    public function traiter(Request $request, Retrait $retrait): JsonResponse
    {
        $admin = $request->user();
        abort_unless($admin->role === self::ADMIN, Response::HTTP_FORBIDDEN, 'Accès refusé.');

        $data = $request->validate([
            'decision' => ['required', Rule::in([self::DECISION_APPROUVER, self::DECISION_REJETER])],
            'motif' => ['required_if:decision,' . self::DECISION_REJETER, 'nullable', 'string', 'max:500'],
        ], ['motif.required_if' => 'Indiquez le motif du rejet.']);

        if ($data['decision'] === self::DECISION_REJETER) {
            $retrait->rejeter($data['motif'], $admin);
        } else {
            $this->retraits->valider($retrait, $admin);
        }

        return response()->json($retrait->fresh(['validateur:id,nom,prenom']));
    }
}
