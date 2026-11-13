<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class PayTechService
{
    private const BASE = 'https://paytech.sn/api';

    private function headers(): array
    {
        return [
            'API_KEY'    => (string) config('services.paytech.key'),
            'API_SECRET' => (string) config('services.paytech.secret'),
        ];
    }

    public function isConfigured(): bool
    {
        return config('services.paytech.key') && config('services.paytech.secret');
    }

    // POST /payment/request-payment
 public function requestPayment(array $payload): array
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->acceptJson()
                ->asJson()
                ->timeout(20)
                ->post(self::BASE . '/payment/request-payment', $payload);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('PayTech injoignable : ' . $e->getMessage());

            return ['success' => 0, 'message' => 'Connexion à PayTech impossible : ' . $e->getMessage()];
        }

        return $response->json()
            ?? ['success' => 0, 'message' => 'Réponse PayTech illisible (HTTP ' . $response->status() . ')'];
    }
    // GET /payment/get-status?token_payment=...
    public function getStatus(string $token): array
    {
        $response = Http::withHeaders($this->headers())
            ->acceptJson()
            ->timeout(20)
            ->get(self::BASE . '/payment/get-status', ['token_payment' => $token]);

        return $response->json() ?? [];
    }

    // Vérifie qu'un appel IPN vient bien de PayTech
    public function verifyIpn(Request $request): bool
    {
        $key = (string) config('services.paytech.key');
        $secret = (string) config('services.paytech.secret');

        if ($key === '' || $secret === '') {
            return false;
        }

        // Méthode recommandée : HMAC-SHA256 sur « prix|ref_command|api_key »
        $hmac = $request->input('hmac_compute');

        if ($hmac) {
            $price = $request->input('final_item_price') ?: $request->input('item_price');
            $message = $this->normalizePrice($price) . '|' . $request->input('ref_command') . '|' . $key;

            return hash_equals(hash_hmac('sha256', $message, $secret), (string) $hmac);
        }

        // Méthode classique : comparaison des SHA256 des clés
        return hash_equals(hash('sha256', $key), (string) $request->input('api_key_sha256'))
            && hash_equals(hash('sha256', $secret), (string) $request->input('api_secret_sha256'));
    }

    public function normalizePrice($price): string
    {
        if (is_numeric($price) && (float) $price == floor((float) $price)) {
            return (string) (int) $price;
        }

        return (string) $price;
    }
}