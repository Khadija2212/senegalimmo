<?php

namespace App\Http\Controllers;

use App\Enums\StatutPaiement;
use App\Exceptions\PasserelleIndisponible;
use App\Http\Requests\InitierPaiementRequest;
use App\Models\Contrat;
use App\Models\Paiement;
use App\Models\PaiementCaution;
use App\Models\PaiementIndemnite;
use App\Models\PromesseVente;
use App\Services\Paiement\Echeancier;
use App\Services\Paiement\OuverturePaiement;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class PaiementController extends Controller
{
    private const ERREUR_PASSERELLE = 502;
    private const ADMIN = 'administrateur';

    public function __construct(private readonly OuverturePaiement $ouverture, private readonly Echeancier $echeancier)
    {
    }

    /** Les paiements où l'on paie ou reçoit (tous pour l'administrateur). */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $requete = Paiement::tous()->latest()->with('recu');

        if ($user->role !== self::ADMIN) {
            $requete->where(fn (Builder $q) => $q
                ->whereIn('bail_id', Contrat::where('locataire_id', $user->id)->orWhere('proprietaire_id', $user->id)->select('id'))
                ->orWhereIn('promesse_id', PromesseVente::where('acheteur_id', $user->id)->orWhere('vendeur_id', $user->id)->select('id')));
        }

        return response()->json($requete->get()->map(fn (Paiement $p) => $this->presenter($p)));
    }

    public function echeancier(Request $request, Contrat $contrat): JsonResponse
    {
        if ($contrat->locataire_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        return response()->json($this->echeancier->resume($contrat));
    }

    /** Cas « Effectuer un paiement » : crée le paiement puis l'ouvre chez PayTech. */
    public function initier(InitierPaiementRequest $request): JsonResponse
    {
        $user = $request->user();
        $m = $request->methode();
        $paiement = match ($request->validated('type')) {
            PaiementIndemnite::TYPE => $this->ouverture->indemnite(PromesseVente::findOrFail($request->validated('promesse_id')), $user, $m),
            PaiementCaution::TYPE => $this->ouverture->caution(Contrat::findOrFail($request->validated('bail_id')), $user, $m),
            default => $this->ouverture->loyer(Contrat::findOrFail($request->validated('bail_id')), $user, $m),
        };

        try {
            $url = $paiement->initier();
        } catch (PasserelleIndisponible $e) {
            $paiement->echouer($e->getMessage());

            return response()->json(['message' => "Le paiement n'a pas pu être ouvert : " . $e->getMessage()], self::ERREUR_PASSERELLE);
        }

        return response()->json(['redirect_url' => $url, 'reference' => $paiement->reference]);
    }

    /** Page de retour : où en est ce paiement. */
    public function showByReference(Request $request, string $reference): JsonResponse
    {
        $paiement = Paiement::tous()->with('recu')->where('reference', $reference)->first();
        if ($paiement === null || !$paiement->payeur()?->is($request->user())) {
            return response()->json(['message' => 'Paiement introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return response()->json($this->presenter($paiement));
    }

    /** Cas « Télécharger quittances » : seulement pour un paiement réussi. */
    public function quittance(Request $request, Paiement $paiement): Response
    {
        if (!$paiement->estPartie($request->user())) {
            return response()->json(['message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }
        if ($paiement->statut !== StatutPaiement::REUSSI || $paiement->recu === null) {
            return response()->json(['message' => "Aucune quittance : le paiement n'est pas confirmé."], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $chemin = $paiement->recu->telecharger();

        return response(Storage::disk('local')->get($chemin), Response::HTTP_OK, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $paiement->recu->numero . '.pdf"',
        ]);
    }

    /** @return array<string, mixed> */
    private function presenter(Paiement $p): array
    {
        $bien = $p->bien();

        return $p->toArray() + [
            'bien' => $bien?->only(['id', 'titre', 'quartier', 'ville']),
            'payeur' => $p->payeur()?->only(['id', 'nom', 'prenom']),
            'beneficiaire' => $p->beneficiaire()?->only(['id', 'nom', 'prenom']),
            'montant_net' => $p->montantNet(),
        ];
    }
}
