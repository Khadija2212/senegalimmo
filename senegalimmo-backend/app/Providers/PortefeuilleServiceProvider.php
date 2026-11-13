<?php

namespace App\Providers;

use App\Models\Commission;
use App\Models\DemandeRetrait;
use App\Models\MouvementPortefeuille;
use App\Models\Paiement;
use App\Models\User;
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
        DemandeRetrait::created(function (DemandeRetrait $r) {
            $u = $r->user;
            Notifier::admins(
                'Demande de retrait',
                trim($u?->prenom . ' ' . $u?->nom) . ' demande ' . self::fcfa($r->montant) . '.',
                '/admin/retraits'
            );
        });

        DemandeRetrait::updated(function (DemandeRetrait $r) {
            if (!$r->wasChanged('statut')) {
                return;
            }

            if ($r->statut === 'validee') {
                Notifier::envoyer($r->user_id, 'Retrait effectué',
                    'Votre retrait de ' . self::fcfa($r->montant) . ' a été effectué.', '/portefeuille');
            }

            if ($r->statut === 'rejetee') {
                Notifier::envoyer($r->user_id, 'Retrait rejeté',
                    'Votre retrait de ' . self::fcfa($r->montant) . ' est rejeté'
                    . ($r->motif_rejet ? ' : ' . $r->motif_rejet : '.') . ' Le montant est remboursé sur votre portefeuille.',
                    '/portefeuille');
            }
        });

        // Historique : chaque paiement confirmé crédite le portefeuille du bénéficiaire.
        // L'événement part avant l'incrément du solde, d'où « solde actuel + montant ».
        Paiement::updated(function (Paiement $p) {
            if (!$p->wasChanged('statut') || $p->statut !== 'confirme') {
                return;
            }

            $solde = (float) User::whereKey($p->beneficiaire_id)->value('solde_portefeuille');
            $libelle = $p->type === 'caution' ? 'Caution reçue' : 'Loyer reçu' . ($p->periode ? ' (' . $p->periode . ')' : '');

            MouvementPortefeuille::create([
                'user_id'     => $p->beneficiaire_id,
                'type'        => 'credit',
                'montant'     => $p->montant,
                'solde_apres' => $solde + (float) $p->montant,
                'libelle'     => $libelle . ' - ' . $p->reference,
            ]);
        });

        Commission::updated(function (Commission $c) {
            if ($c->wasChanged('statut') && $c->statut === 'reglee' && request()->user()?->id !== $c->agence_id) {
                Notifier::envoyer($c->agence_id, 'Commission réglée',
                    'Le propriétaire a réglé ' . self::fcfa($c->montant) . ' sur votre portefeuille.', '/portefeuille');
            }
        });
    }
}