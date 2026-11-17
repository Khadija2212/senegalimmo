<?php

namespace App\Services\Cartographie;

use App\Contracts\ServiceCartographie;
use App\Exceptions\PasserelleIndisponible;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

/** ServiceCartographie par l'API Geocoding v6 de Mapbox, limitée au Sénégal. */
class CartographieMapbox implements ServiceCartographie
{
    private const BASE = 'https://api.mapbox.com/search/geocode/v6/';

    private const PAYS = 'sn';

    private const LANGUE = 'fr';

    private const DELAI_S = 10;

    public function __construct(private readonly string $jeton) {}

    public function geocoder(string $adresse): array
    {
        $lieu = $this->premierResultat('forward', ['q' => $adresse, 'limit' => 1]);
        $coord = $lieu['properties']['coordinates'] ?? null;
        if (! isset($coord['latitude'], $coord['longitude'])) {
            throw new PasserelleIndisponible('Adresse introuvable sur la carte.');
        }

        return [(float) $coord['latitude'], (float) $coord['longitude']];
    }

    public function adresseDe(float $lat, float $lng): string
    {
        $lieu = $this->premierResultat('reverse', ['latitude' => $lat, 'longitude' => $lng, 'limit' => 1]);

        return (string) ($lieu['properties']['full_address'] ?? $lieu['properties']['place_formatted'] ?? $lieu['properties']['name'] ?? '');
    }

    /** @param array<string, scalar> $parametres @return array<string, mixed> */
    private function premierResultat(string $sens, array $parametres): array
    {
        if ($this->jeton === '') {
            throw new PasserelleIndisponible("La clé Mapbox n'est pas configurée.");
        }
        try {
            $reponse = Http::timeout(self::DELAI_S)->get(self::BASE.$sens, $parametres + [
                'country' => self::PAYS, 'language' => self::LANGUE, 'access_token' => $this->jeton,
            ]);
        } catch (ConnectionException $e) {
            throw new PasserelleIndisponible('Mapbox ne répond pas.');
        }
        if ($reponse->failed() || empty($reponse->json('features'))) {
            throw new PasserelleIndisponible('Adresse introuvable sur la carte.');
        }

        return (array) $reponse->json('features.0');
    }
}
