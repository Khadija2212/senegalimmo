<?php

use App\Services\Echeances;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('echeances:expirer', function (Echeances $echeances): void {
    foreach ($echeances->expirer() as $classe => $nombre) {
        $this->info($classe.' expirés : '.$nombre);
    }
})->purpose('Passe à expiré les mandats, offres et promesses dont la date est dépassée');

Schedule::command('echeances:expirer')->dailyAt('01:00');
