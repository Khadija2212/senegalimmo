<?php

namespace App\Services\Notification;

use App\Exceptions\PasserelleIndisponible;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/** Envoi de SMS par l'API SMS d'Orange (Sénégal) : jeton OAuth client_credentials, puis requête sortante. */
class SmsOrange
{
    private const BASE = 'https://api.orange.com';

    private const INDICATIF = '221';

    private const CLE_CACHE = 'orange_sms_jeton';

    private const MARGE_EXPIRATION_S = 60;

    private const DELAI_S = 15;

    public function __construct(
        private readonly string $clientId,
        private readonly string $secret,
        private readonly string $numeroExpediteur,
        private readonly string $nomExpediteur,
    ) {}

    public function envoyer(string $telephone, string $texte): void
    {
        $expediteur = 'tel:+'.$this->numeroExpediteur;
        $corps = ['address' => 'tel:+'.self::international($telephone), 'senderAddress' => $expediteur, 'outboundSMSTextMessage' => ['message' => $texte]];
        if ($this->nomExpediteur !== '') {
            $corps['senderName'] = $this->nomExpediteur;
        }
        $reponse = Http::timeout(self::DELAI_S)->withToken($this->jeton())
            ->post(self::BASE.'/smsmessaging/v1/outbound/'.rawurlencode($expediteur).'/requests', ['outboundSMSMessageRequest' => $corps]);
        if ($reponse->status() !== 201) {
            Cache::forget(self::CLE_CACHE);
            throw new PasserelleIndisponible("Orange n'a pas accepté le SMS (".$reponse->status().').');
        }
    }

    /** Numéro au format international sans « + » : 77 123 45 67 devient 221771234567. */
    public static function international(string $telephone): string
    {
        $chiffres = preg_replace('/\D/', '', $telephone) ?? '';

        return str_starts_with($chiffres, self::INDICATIF) ? $chiffres : self::INDICATIF.$chiffres;
    }

    private function jeton(): string
    {
        $jeton = Cache::get(self::CLE_CACHE);
        if (is_string($jeton)) {
            return $jeton;
        }
        $reponse = Http::timeout(self::DELAI_S)->asForm()->acceptJson()
            ->withBasicAuth($this->clientId, $this->secret)
            ->post(self::BASE.'/oauth/v3/token', ['grant_type' => 'client_credentials']);
        if ($reponse->failed() || ! is_string($reponse->json('access_token'))) {
            throw new PasserelleIndisponible("Orange a refusé l'authentification SMS.");
        }
        Cache::put(self::CLE_CACHE, $reponse->json('access_token'), max(1, (int) $reponse->json('expires_in') - self::MARGE_EXPIRATION_S));

        return $reponse->json('access_token');
    }
}
