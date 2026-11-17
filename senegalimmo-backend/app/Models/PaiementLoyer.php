<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** PaiementLoyer du diagramme : règle un mois de loyer d'un Bail (0..* vers 1). */
class PaiementLoyer extends Paiement
{
    /** Association « règle ». */
    public function bail(): BelongsTo
    {
        return $this->belongsTo(Bail::class, 'bail_id');
    }

    public function libelle(): string
    {
        $mois = $this->mois_concerne?->locale('fr')->translatedFormat('F Y') ?? '';

        return trim('Loyer '.$mois);
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
