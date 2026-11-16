<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** PaiementCaution : dépôt de garantie d'un Bail (0..1 vers 1), restituable en fin de bail. */
class PaiementCaution extends Paiement
{
    public const TYPE = 'caution';

    protected $attributes = ['restituable' => true];

    public function bail(): BelongsTo
    {
        return $this->belongsTo(Contrat::class, 'bail_id');
    }

    public function libelle(): string
    {
        return 'Caution du bail';
    }

    public function payeur(): ?User
    {
        return $this->bail?->locataire;
    }

    public function beneficiaire(): ?User
    {
        return $this->bail?->proprietaire;
    }

    public function bien(): ?Bien
    {
        return $this->bail?->bien;
    }
}
