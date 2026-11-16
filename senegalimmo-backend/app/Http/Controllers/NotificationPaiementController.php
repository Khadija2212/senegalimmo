<?php

namespace App\Http\Controllers;

use App\Contracts\PasserellePaiement;
use App\Models\Paiement;
use App\Services\Paiement\GestionRetraits;
use App\Services\Paiement\PasserelleSimulee;
use App\Services\Paiement\PayTechPasserelle;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response as Http;

/**
 * Notifications de paiement (IPN) envoyées par la passerelle.
 * Route publique : l'authenticité vient de la signature, pas d'un jeton de session.
 */
class NotificationPaiementController extends Controller
{
    private const VENTE_REUSSIE = 'sale_complete';
    private const VENTE_ANNULEE = 'sale_canceled';
    private const VERSEMENT_REUSSI = 'transfer_success';
    private const VERSEMENT_ECHOUE = 'transfer_failed';

    public function __construct(private readonly PasserellePaiement $passerelle, private readonly GestionRetraits $retraits)
    {
    }

    public function ipn(Request $request): Response
    {
        $corps = $request->getContent() !== '' ? $request->getContent() : http_build_query($request->all());
        if (!$this->passerelle->verifierNotification((string) $request->input('hmac_compute', ''), $corps)) {
            Log::warning('Notification de paiement rejetée : signature invalide.');

            return response('Signature invalide', Http::HTTP_FORBIDDEN);
        }

        $donnees = PayTechPasserelle::lireCorps($corps);
        $evenement = (string) ($donnees['type_event'] ?? '');
        if (in_array($evenement, [self::VERSEMENT_REUSSI, self::VERSEMENT_ECHOUE], true)) {
            $connu = $this->retraits->suiteVersement((string) ($donnees['id_transfer'] ?? ''), $evenement === self::VERSEMENT_REUSSI);

            return $connu ? response('OK', Http::HTTP_OK) : response('Versement inconnu', Http::HTTP_NOT_FOUND);
        }

        $paiement = Paiement::tous()->where('reference', (string) ($donnees['ref_command'] ?? ''))->first();
        if ($paiement === null) {
            return response('Référence inconnue', Http::HTTP_NOT_FOUND);
        }

        return $this->appliquer($paiement, $donnees);
    }

    /** @param array<string, mixed> $donnees */
    private function appliquer(Paiement $paiement, array $donnees): Response
    {
        $evenement = (string) ($donnees['type_event'] ?? '');

        if ($evenement === self::VENTE_REUSSIE) {
            $recu = (int) round((float) ($donnees['item_price'] ?? 0));
            if ($recu !== $paiement->montant) {
                Log::warning('Notification de paiement : montant différent.', ['attendu' => $paiement->montant, 'recu' => $recu]);

                return response('Montant incohérent', Http::HTTP_UNPROCESSABLE_ENTITY);
            }
            $paiement->confirmer((string) ($donnees['token'] ?? ''));
        } elseif ($evenement === self::VENTE_ANNULEE) {
            $paiement->echouer('Annulé chez le prestataire.');
        }

        return response('OK', Http::HTTP_OK);
    }

    /**
     * Page de paiement de la passerelle simulée : envoie à l'IPN une notification signée,
     * exactement comme PayTech, puis renvoie vers la page de retour du site.
     */
    public function simulation(string $reference, string $jeton): RedirectResponse
    {
        abort_unless($this->passerelle instanceof PasserelleSimulee, Http::HTTP_NOT_FOUND);
        $paiement = Paiement::tous()->where('reference', $reference)->firstOrFail();

        $corps = [
            'type_event' => self::VENTE_REUSSIE,
            'ref_command' => $paiement->reference,
            'item_price' => $paiement->montant,
            'token' => $jeton,
            'hmac_compute' => $this->passerelle->signer($paiement->montant, $paiement->reference),
        ];
        $this->ipn(Request::create('/api/paiements/ipn', 'POST', $corps));

        return redirect()->away(rtrim((string) config('services.paytech.front_url'), '/') . '/paiement/retour?ref=' . urlencode($reference));
    }
}
