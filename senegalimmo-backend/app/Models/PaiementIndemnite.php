<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * PaiementIndemnite du diagramme : indemnité d'immobilisation qui garantit une PromesseVente (0..1 vers 1).
 * Elle est restituable à l'acheteur tant que la vente n'est pas conclue par sa faute.
 */
class PaiementIndemnite extends Paiement
{
    protected $attributes = ['restituable' => true];

    protected function casts(): array
    {
        return ['restituable' => 'boolean'];
    }

    /** Association « garantit ». */
    public function promesse(): BelongsTo
    {
        return $this->belongsTo(PromesseVente::class, 'promesse_id');
    }

    public function libelle(): string
    {
        return "Indemnité d'immobilisation";
    }

    public function payeur(): ?Client
    {
        return $this->promesse?->acheteur();
    }

    public function beneficiaire(): ?Proprietaire
    {
        return $this->promesse?->vendeur();
    }

    public function bien(): ?Bien
    {
        return $this->promesse?->bienConcerne();
    }
}
