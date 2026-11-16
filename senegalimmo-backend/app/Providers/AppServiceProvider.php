<?php

namespace App\Providers;

use App\Contracts\PasserellePaiement;
use App\Models\Paiement;
use App\Services\Paiement\GestionRetraits;
use App\Services\Paiement\PasserelleSimulee;
use App\Services\Paiement\PayTechPasserelle;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
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
        // Paiement est abstrait : la liaison de route charge la bonne sous-classe.
        Route::bind('paiement', fn (string $id): Paiement => Paiement::tous()->findOrFail($id));
    }
}
