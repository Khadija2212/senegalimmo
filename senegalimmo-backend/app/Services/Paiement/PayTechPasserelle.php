<?php

namespace App\Services\Paiement;

use App\Contracts\PasserellePaiement;
use App\Enums\MethodePaiement;
use App\Exceptions\PasserelleIndisponible;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * Implémentation PayTech de PasserellePaiement.
 * Référence : https://docs.intech.sn/doc_paytech.php
 */
class PayTechPasserelle implements PasserellePaiement
{
    private const DEVISE = 'XOF';

    private const DELAI_SECONDES = 20;

    private const SUCCES = 1;

    private const PREFIXE_HTTPS = 'https://';

    public function __construct(
        private readonly string $cle,
        private readonly string $secret,
        private readonly string $environnement,
        private readonly string $urlBase,
        private readonly string $urlFront,
        private readonly string $urlIpn,
    ) {}

    public function demanderPaiement(string $ref, int $montant, MethodePaiement $m): string
    {
        $retour = rtrim($this->urlFront, '/').'/paiement/retour?ref='.urlencode($ref);
        $corps = [
            'item_name' => 'SénégalImmo '.$ref,
            'item_price' => $montant,
            'currency' => self::DEVISE,
            'ref_command' => $ref,
            'command_name' => 'Paiement '.$ref.' sur SénégalImmo',
            'env' => $this->environnement,
            'target_payment' => $m->nomPaytech(),
            'success_url' => $retour,
            'cancel_url' => $retour.'&annule=1',
            'custom_field' => json_encode(['ref' => $ref]),
        ];
        if (str_starts_with($this->urlIpn, self::PREFIXE_HTTPS)) {
            $corps['ipn_url'] = $this->urlIpn;
        }

        $reponse = $this->envoyer('/payment/request-payment', $corps);
        $url = $reponse->json('redirect_url') ?? $reponse->json('redirectUrl');
        if ((int) $reponse->json('success') !== self::SUCCES || ! is_string($url)) {
            throw new PasserelleIndisponible((string) ($reponse->json('message') ?? 'Demande de paiement refusée par PayTech.'));
        }

        return $url;
    }

    public function verifierNotification(string $signature, string $corps): bool
    {
        if ($this->cle === '' || $this->secret === '') {
            return false;
        }
        $donnees = self::lireCorps($corps);

        if ($signature !== '') {
            return $this->verifierHmac($signature, $donnees);
        }

        return hash_equals(hash('sha256', $this->cle), (string) ($donnees['api_key_sha256'] ?? ''))
            && hash_equals(hash('sha256', $this->secret), (string) ($donnees['api_secret_sha256'] ?? ''));
    }

    public function transferer(string $numero, int $montant, MethodePaiement $m): string
    {
        $service = $m->serviceTransfert();
        if ($service === null) {
            throw new PasserelleIndisponible('Aucun versement possible vers '.$m->libelle().'.');
        }

        $corps = ['amount' => $montant, 'destination_number' => $numero, 'service' => $service];
        if (str_starts_with($this->urlIpn, self::PREFIXE_HTTPS)) {
            $corps['callback_url'] = $this->urlIpn;
        }
        $reponse = $this->envoyer('/transfer/transferFund', $corps);
        $id = $reponse->json('transfer.id_transfer');
        if ((int) $reponse->json('success') !== self::SUCCES || ! is_string($id)) {
            throw new PasserelleIndisponible((string) ($reponse->json('message') ?? 'Versement refusé par PayTech.'));
        }

        return $id;
    }

    /** @return array<string, mixed> */
    public static function lireCorps(string $corps): array
    {
        $json = json_decode($corps, true);
        if (is_array($json)) {
            return $json;
        }
        parse_str($corps, $formulaire);

        return $formulaire;
    }

    /**
     * La doc signe « montant|ref_command|api_key » (paiement) ou « montant|id_transfer|api_key »
     * (versement). Ses exemples prennent final_item_price ou item_price : les deux sont acceptés.
     *
     * @param  array<string, mixed>  $donnees
     */
    private function verifierHmac(string $signature, array $donnees): bool
    {
        $ref = (string) ($donnees['ref_command'] ?? $donnees['id_transfer'] ?? '');
        $prix = array_filter([$donnees['final_item_price'] ?? null, $donnees['item_price'] ?? null, $donnees['amount'] ?? null], 'is_numeric');

        foreach ($prix as $p) {
            $attendu = hash_hmac('sha256', self::normaliserPrix($p).'|'.$ref.'|'.$this->cle, $this->secret);
            if (hash_equals($attendu, $signature)) {
                return true;
            }
        }

        return false;
    }

    public static function normaliserPrix(int|float|string $prix): string
    {
        $valeur = (float) $prix;

        return $valeur === floor($valeur) ? (string) (int) $valeur : (string) $prix;
    }

    /** @param array<string, mixed> $corps */
    private function envoyer(string $chemin, array $corps): Response
    {
        try {
            return Http::withHeaders(['API_KEY' => $this->cle, 'API_SECRET' => $this->secret])
                ->acceptJson()
                ->asJson()
                ->timeout(self::DELAI_SECONDES)
                ->post(rtrim($this->urlBase, '/').$chemin, $corps);
        } catch (ConnectionException $e) {
            throw new PasserelleIndisponible('PayTech est injoignable.', 0, $e);
        }
    }
}
