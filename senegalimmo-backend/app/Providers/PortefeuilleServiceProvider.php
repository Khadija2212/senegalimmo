<?php

namespace App\Providers;

use App\Models\Commission;
use App\Enums\StatutRetrait;
use App\Models\Retrait;
use App\Services\Notifier;
use Illuminate\Support\ServiceProvider;

class PortefeuilleServiceProvider extends ServiceProvider
{
    public function register(): void
    {
    }

    private static function fcfa($n): string
    {
        return number_format((float) $n, 0, ',', ' ') . ' FCFA';
    }

    public function boot(): void
    {
        Retrait::created(function (Retrait $r) {
            $u = $r->portefeuille?->user;
            Notifier::admins(
                'Demande de retrait',
                trim($u?->prenom . ' ' . $u?->nom) . ' demande ' . self::fcfa($r->montant) . '.',
                '/admin/retraits'
            );
        });

        Retrait::updated(function (Retrait $r) {
            if (!$r->wasChanged('statut') || ($userId = $r->portefeuille?->user_id) === null) {
                return;
            }
            if ($r->statut === StatutRetrait::VERSE) {
                Notifier::envoyer($userId, 'Retrait versé',
                    'Votre retrait de ' . self::fcfa($r->montant) . ' est versé sur ' . $r->methode->libelle() . '.', '/portefeuille');
            }
            if ($r->statut === StatutRetrait::REJETE) {
                Notifier::envoyer($userId, 'Retrait rejeté',
                    'Votre retrait de ' . self::fcfa($r->montant) . ' est rejeté'
                    . ($r->motif_rejet ? ' : ' . $r->motif_rejet : '.') . ' Le montant est de nouveau disponible.',
                    '/portefeuille');
            }
        });

        Commission::updated(function (Commission $c) {
            if ($c->wasChanged('statut') && $c->statut === 'reglee' && request()->user()?->id !== $c->agence_id) {
                Notifier::envoyer($c->agence_id, 'Commission réglée',
                    'Le propriétaire a réglé ' . self::fcfa($c->montant) . ' sur votre portefeuille.', '/portefeuille');
            }
        });
    }
}