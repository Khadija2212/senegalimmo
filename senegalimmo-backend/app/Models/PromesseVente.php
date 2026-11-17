<?php

namespace App\Models;

use App\Enums\StatutContrat;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/** PromesseVente du diagramme : concrétise une OffreAchat acceptée, garantie par une indemnité. */
class PromesseVente extends Contrat
{
    protected function casts(): array
    {
        return [
            'prix_vente' => 'integer', 'indemnite_immobilisation' => 'integer', 'date_limite_acte' => 'date',
        ];
    }

    protected function prefixeReference(): string
    {
        return 'SI-PV-';
    }

    protected function vueDocument(): string
    {
        return 'pdf.promesse';
    }

    /** Association « concrétise » : PromesseVente 0..1 vers OffreAchat 1. */
    public function offreAchat(): BelongsTo
    {
        return $this->belongsTo(OffreAchat::class);
    }

    public function annonce(): Annonce
    {
        return $this->offreAchat->annonce;
    }

    public function bienConcerne(): Bien
    {
        return $this->annonce()->bien;
    }

    public function acheteur(): Client
    {
        return $this->offreAchat->client;
    }

    public function vendeur(): Proprietaire
    {
        return $this->bienConcerne()->proprietaire;
    }

    public function signataires(): array
    {
        return [$this->vendeur(), $this->acheteur()];
    }

    /** Association « garantit » : PaiementIndemnite 0..1 vers PromesseVente 1. */
    public function paiementIndemnite(): HasOne
    {
        return $this->hasOne(PaiementIndemnite::class, 'promesse_id');
    }

    /** Opération du diagramme : la date limite de l'acte est passée sans que la vente soit conclue. */
    public function estExpiree(): bool
    {
        return $this->date_limite_acte->isPast() && ! $this->date_limite_acte->isToday()
            && in_array($this->statut, [StatutContrat::EN_SIGNATURE, StatutContrat::SIGNE, StatutContrat::EXPIRE], true);
    }

    protected function apresSignature(): void
    {
        $this->annonce()->marquerConclue();
    }
}
