<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChangeController extends Controller
{
    // Parité fixe du franc CFA avec l'euro
    private const XOF_PAR_EUR = 655.957;

    private function charger(): ?array
    {
        try {
            $reponse = Http::acceptJson()->timeout(8)->get('https://api.frankfurter.app/latest', [
                'base'    => 'EUR',
                'symbols' => 'USD',
            ]);

            $usd = $reponse->json('rates.USD');

            if ($reponse->successful() && is_numeric($usd)) {
                return [
                    'usd_par_eur' => (float) $usd,
                    'date'        => $reponse->json('date'),
                    'source'      => 'Banque centrale européenne (via Frankfurter)',
                ];
            }
        } catch (\Throwable $e) {
            Log::warning('Taux de change indisponible : ' . $e->getMessage());
        }

        return null;
    }

    public function index()
    {
        $taux = Cache::get('taux_change');

        if (!$taux) {
            $taux = $this->charger();

            if ($taux) {
                Cache::put('taux_change', $taux, now()->addHours(6));
            }
        }

        $indicatif = !$taux;
        $usdParEur = $taux['usd_par_eur'] ?? (float) config('services.change.usd_par_eur');

        return response()->json([
            'eur_par_xof' => 1 / self::XOF_PAR_EUR,
            'usd_par_xof' => $usdParEur / self::XOF_PAR_EUR,
            'date'        => $taux['date'] ?? null,
            'source'      => $taux['source'] ?? 'Taux de secours (service indisponible)',
            'indicatif'   => $indicatif,
        ]);
    }
}