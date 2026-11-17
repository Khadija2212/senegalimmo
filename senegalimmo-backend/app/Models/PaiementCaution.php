<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** PaiementCaution du diagramme : dépôt de garantie d'un Bail (0..1 vers 1). */
class PaiementCaution extends Paiement
{
    /** Association « couvre ». */
    public function bail(): BelongsTo
    {
        return $this->belongsTo(Bail::class, 'bail_id');
    }

    public function libelle(): string
    {
        return 'Caution du bail';
    }

    public function payeur(): ?Client
    {
        return $this->bail?->locataire();
    }

    public function beneficiaire(): ?Proprietaire
    {
        return $this->bail?->proprietaire();
    }

    public function bien(): ?Bien
    {
        return $this->bail?->bienConcerne();
    }
}
