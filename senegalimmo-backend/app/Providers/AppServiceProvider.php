<?php

namespace App\Providers;

use App\Auth\FournisseurComptes;
use App\Contracts\PasserellePaiement;
use App\Contracts\ServiceCartographie;
use App\Contracts\ServiceNotification;
use App\Contracts\ServiceSignature;
use App\Contracts\ServiceStockage;
use App\Models\Compte;
use App\Models\Contrat;
use App\Models\JetonAcces;
use App\Models\Paiement;
use App\Services\Cartographie\CartographieMapbox;
use App\Services\Notification\NotificationMulticanal;
use App\Services\Notification\PushFirebase;
use App\Services\Notification\SmsOrange;
use App\Services\Paiement\GestionRetraits;
use App\Services\Paiement\PasserelleSimulee;
use App\Services\Paiement\PayTechPasserelle;
use App\Services\Signature\SignatureElectroniqueSimple;
use App\Services\Stockage\StockageDisque;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;
use LogicException;

/** Liaison de chaque interface du diagramme à son implémentation. */
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PasserellePaiement::class, fn (): PasserellePaiement => $this->passerelle());
        $this->app->bind(GestionRetraits::class, fn ($app): GestionRetraits => new GestionRetraits(
            $app->make(PasserellePaiement::class),
            (int) config('services.retrait.minimum'),
        ));
        $this->app->singleton(ServiceStockage::class, fn (): ServiceStockage => new StockageDisque((string) config('services.stockage.disque')));
        $this->app->singleton(ServiceCartographie::class, fn (): ServiceCartographie => new CartographieMapbox((string) config('services.mapbox.jeton')));
        $this->app->singleton(ServiceSignature::class, SignatureElectroniqueSimple::class);
        $this->app->singleton(ServiceNotification::class, fn (): ServiceNotification => new NotificationMulticanal($this->sms(), $this->push()));
    }

    public function boot(): void
    {
        // Compte, Paiement et Contrat sont abstraits : les liaisons de route chargent la bonne sous-classe.
        Route::bind('compte', fn (string $id): Compte => Compte::tous()->findOrFail($id));
        Route::bind('paiement', fn (string $id): Paiement => Paiement::tous()->findOrFail($id));
        Route::bind('contrat', fn (string $id): Contrat => Contrat::tous()->findOrFail($id));
        Auth::provider('comptes', fn ($app, array $config) => new FournisseurComptes($app['hash'], $config['model']));
        Sanctum::usePersonalAccessTokenModel(JetonAcces::class);
    }

    private function passerelle(): PasserellePaiement
    {
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
    }

    private function sms(): ?SmsOrange
    {
        $c = config('services.orange_sms');
        if ($c['client_id'] === '' || $c['secret'] === '') {
            return null;
        }

        return new SmsOrange($c['client_id'], $c['secret'], $c['numero_expediteur'], $c['nom_expediteur']);
    }

    private function push(): ?PushFirebase
    {
        $chemin = (string) config('services.firebase.compte_service');
        if ($chemin === '' || ! is_readable($chemin)) {
            return null;
        }

        return new PushFirebase((array) json_decode((string) file_get_contents($chemin), true));
    }
}
