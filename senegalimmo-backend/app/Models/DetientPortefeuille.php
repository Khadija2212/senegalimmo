<?php

namespace App\Models;

use App\Enums\MethodePaiement;
use App\Services\Paiement\GestionRetraits;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Association « détient » (Proprietaire et Agent vers Portefeuille, 0..1)
 * et opération demanderRetrait() que le diagramme donne aux deux classes.
 *
 * @mixin Compte
 */
trait DetientPortefeuille
{
    public function portefeuille(): HasOne
    {
        return $this->hasOne(Portefeuille::class, 'user_id');
    }

    public function demanderRetrait(int $montant, MethodePaiement $m, string $numero): Retrait
    {
        return app(GestionRetraits::class)->demander($this, $montant, $m, $numero);
    }

    protected function soldeDisponible(): int
    {
        return (int) ($this->portefeuille?->solde_disponible ?? 0);
    }
}
