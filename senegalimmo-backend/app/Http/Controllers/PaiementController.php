<?php

namespace App\Http\Controllers;

use App\Enums\StatutPaiement;
use App\Exceptions\OperationRefusee;
use App\Exceptions\PasserelleIndisponible;
use App\Http\Requests\InitierPaiementRequest;
use App\Models\Bail;
use App\Models\Client;
use App\Models\Paiement;
use App\Models\PromesseVente;
use App\Services\Paiement\OuverturePaiement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Cas « Effectuer un paiement » (client), généralisé en loyer, caution et indemnité,
 * qui inclut « Générer reçu de paiement » ; « Consulter les paiements reçus » (propriétaire) ;
 * « Télécharger quittances ».
 */
class PaiementController extends Controller
{
    private const ERREUR_PASSERELLE = 502;

    public function __construct(private readonly OuverturePaiement $ouverture) {}

    /** Les paiements où l'on paie (client) ou reçoit (propriétaire). */
    public function index(Request $request): JsonResponse
    {
        $paiements = Paiement::concernant($request->user())->with('recu')->latest()
            ->get()->map(fn (Paiement $p) => $this->presenter($p));

        return response()->json($paiements);
    }

    /** Crée le paiement, puis le client l'ouvre chez la passerelle (opération payer). */
    public function initier(InitierPaiementRequest $request): JsonResponse
    {
        /** @var Client $client */
        $client = $request->user();
        $m = $request->methode();
        $paiement = match ($request->validated('type')) {
            'indemnite' => $this->ouverture->indemnite(PromesseVente::findOrFail($request->validated('promesse_id')), $client, $m),
            'caution' => $this->ouverture->caution(Bail::findOrFail($request->validated('bail_id')), $client, $m),
            default => $this->ouverture->loyer(Bail::findOrFail($request->validated('bail_id')), $client, $m),
        };

        try {
            $url = $client->payer($paiement, $m);
        } catch (PasserelleIndisponible $e) {
            $paiement->echouer($e->getMessage());

            return response()->json(['message' => "Le paiement n'a pas pu être ouvert : ".$e->getMessage()], self::ERREUR_PASSERELLE);
        }

        return response()->json(['redirect_url' => $url, 'reference' => $paiement->reference]);
    }

    /** Page de retour : où en est ce paiement. */
    public function parReference(Request $request, string $reference): JsonResponse
    {
        $paiement = Paiement::tous()->with('recu')->where('reference', $reference)->firstOrFail();
        $this->exigerQue($paiement->estPartie($request->user()));

        return response()->json($this->presenter($paiement));
    }

    /** Cas « Télécharger quittances » : une adresse de lecture du reçu d'un paiement réussi. */
    public function quittance(Request $request, Paiement $paiement): JsonResponse
    {
        $this->exigerQue($paiement->estPartie($request->user()));
        if ($paiement->statut !== StatutPaiement::REUSSI || $paiement->recu === null) {
            throw new OperationRefusee("Aucune quittance : le paiement n'est pas confirmé.");
        }

        return response()->json(['url' => $paiement->recu->telecharger(), 'numero' => $paiement->recu->numero]);
    }

    /** @return array<string, mixed> */
    private function presenter(Paiement $p): array
    {
        return $p->toArray() + [
            'bien' => $p->bien()?->only(['id', 'titre', 'quartier', 'ville']),
            'payeur' => $p->payeur()?->only(['id', 'nom', 'prenom']),
            'beneficiaire' => $p->beneficiaire()?->only(['id', 'nom', 'prenom']),
            'montant_net' => $p->montantNet(),
        ];
    }
}
