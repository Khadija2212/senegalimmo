<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** PaiementIndemnite du diagramme : garantit une PromesseVente (0..1 vers 1). */
class PaiementIndemnite extends Paiement
{
    public const TYPE = 'indemnite';

    public function promesse(): BelongsTo
    {
        return $this->belongsTo(PromesseVente::class, 'promesse_id');
    }

    public function libelle(): string
    {
        return "Indemnité d'immobilisation";
    }

    public function payeur(): ?User
    {
        return $this->promesse?->acheteur;
    }

    public function beneficiaire(): ?User
    {
        return $this->promesse?->vendeur;
    }

    public function bien(): ?Bien
    {
        return $this->promesse?->bien;
    }
}
