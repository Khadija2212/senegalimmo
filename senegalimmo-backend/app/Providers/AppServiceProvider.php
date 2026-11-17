<?php

namespace App\Providers;

use App\Auth\FournisseurComptes;
use App\Contracts\PasserellePaiement;
use App\Models\JetonAcces;
use App\Models\Compte;
use App\Models\Paiement;
use App\Services\Paiement\GestionRetraits;
use App\Services\Paiement\PasserelleSimulee;
use App\Services\Paiement\PayTechPasserelle;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;
use LogicException;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PasserellePaiement::class, function (): PasserellePaiement {
            if (config('services.paiement.passerelle') !== PasserelleSimulee::CLE) {
                return new PayTechPasserelle(
                    (string) config('services.paytech.key'),
                    (string) config('services.paytech.secret'),
                    (string) config('services.paytech.env'),
                    (string) config('services.paytech.base_url'),
                    (string) config('services.paytech.front_url'),
                    (string) config('services.paytech.ipn_url'),
                );
            }
            if ($this->app->environment('production')) {
                throw new LogicException('La passerelle simulée est interdite en production.');
            }

            return new PasserelleSimulee((string) config('services.paiement.simulation_secret'), (string) config('app.url'));
        });
        $this->app->bind(GestionRetraits::class, fn ($app): GestionRetraits => new GestionRetraits(
            $app->make(PasserellePaiement::class),
            (int) config('services.retrait.minimum'),
        ));
    }

    public function boot(): void
    {
        // Paiement et Compte sont abstraits : les liaisons de route chargent la bonne sous-classe.
        Route::bind('paiement', fn (string $id): Paiement => Paiement::tous()->findOrFail($id));
        Route::bind('user', fn (string $id): Compte => Compte::tous()->findOrFail($id));
        Auth::provider('comptes', fn ($app, array $config) => new FournisseurComptes($app['hash'], $config['model']));
        Sanctum::usePersonalAccessTokenModel(JetonAcces::class);
    }
}
