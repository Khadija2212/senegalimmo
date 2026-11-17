<?php

namespace App\Services\Notification;

use App\Exceptions\PasserelleIndisponible;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Notification push par Firebase Cloud Messaging (API HTTP v1), envoyée à un sujet :
 * l'application de chaque compte s'abonne au sujet « compte-{id} ».
 * Le jeton OAuth vient du compte de service (JWT signé RS256).
 */
class PushFirebase
{
    private const PORTEE = 'https://www.googleapis.com/auth/firebase.messaging';

    private const TYPE_OCTROI = 'urn:ietf:params:oauth:grant-type:jwt-bearer';

    private const DUREE_JWT_S = 3600;

    private const MARGE_EXPIRATION_S = 60;

    private const CLE_CACHE = 'fcm_jeton';

    private const DELAI_S = 15;

    /** @param array{project_id: string, client_email: string, private_key: string, token_uri: string} $compteService */
    public function __construct(private readonly array $compteService) {}

    public function envoyer(string $sujet, string $titre, string $texte): void
    {
        $url = 'https://fcm.googleapis.com/v1/projects/'.$this->compteService['project_id'].'/messages:send';
        $reponse = Http::timeout(self::DELAI_S)->withToken($this->jeton())
            ->post($url, ['message' => ['topic' => $sujet, 'notification' => ['title' => $titre, 'body' => $texte]]]);
        if ($reponse->failed()) {
            throw new PasserelleIndisponible("Firebase n'a pas accepté la notification (".$reponse->status().').');
        }
    }

    private function jeton(): string
    {
        $jeton = Cache::get(self::CLE_CACHE);
        if (is_string($jeton)) {
            return $jeton;
        }
        $reponse = Http::timeout(self::DELAI_S)->asForm()
            ->post($this->compteService['token_uri'], ['grant_type' => self::TYPE_OCTROI, 'assertion' => $this->assertion()]);
        if ($reponse->failed() || ! is_string($reponse->json('access_token'))) {
            throw new PasserelleIndisponible("Google a refusé l'authentification Firebase.");
        }
        Cache::put(self::CLE_CACHE, $reponse->json('access_token'), max(1, (int) $reponse->json('expires_in') - self::MARGE_EXPIRATION_S));

        return $reponse->json('access_token');
    }

    private function assertion(): string
    {
        $maintenant = time();
        $entete = self::base64Url((string) json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $charge = self::base64Url((string) json_encode([
            'iss' => $this->compteService['client_email'], 'scope' => self::PORTEE, 'aud' => $this->compteService['token_uri'],
            'iat' => $maintenant, 'exp' => $maintenant + self::DUREE_JWT_S,
        ]));
        if (! openssl_sign($entete.'.'.$charge, $signature, $this->compteService['private_key'], OPENSSL_ALGO_SHA256)) {
            throw new PasserelleIndisponible('La clé du compte de service Firebase est invalide.');
        }

        return $entete.'.'.$charge.'.'.self::base64Url($signature);
    }

    private static function base64Url(string $octets): string
    {
        return rtrim(strtr(base64_encode($octets), '+/', '-_'), '=');
    }
}
