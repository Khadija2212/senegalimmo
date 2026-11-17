<?php

namespace App\Services\Stockage;

use App\Contracts\ServiceStockage;
use Illuminate\Support\Facades\Storage;

/** ServiceStockage sur un disque Laravel privé ; la lecture passe par des adresses signées. */
class StockageDisque implements ServiceStockage
{
    public function __construct(private readonly string $disque) {}

    public function televerser(string $fichier, string $nom): string
    {
        Storage::disk($this->disque)->put($nom, $fichier);

        return $nom;
    }

    public function supprimer(string $url): void
    {
        Storage::disk($this->disque)->delete($url);
    }

    public function urlSignee(string $url, int $dureeMin): string
    {
        return Storage::disk($this->disque)->temporaryUrl($url, now()->addMinutes($dureeMin));
    }
}
