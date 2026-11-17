<?php

namespace App\Models;

use App\Enums\StatutBien;
use App\Enums\StatutPaiement;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/** Bail du diagramme : contrat de location issu d'une DemandeLocation. */
class Bail extends Contrat
{
    protected function casts(): array
    {
        return [
            'loyer_mensuel' => 'integer', 'charges' => 'integer', 'caution' => 'integer',
            'duree_mois' => 'integer', 'jour_echeance' => 'integer',
        ];
    }

    protected function prefixeReference(): string
    {
        return 'SI-B-';
    }

    protected function vueDocument(): string
    {
        return 'pdf.bail';
    }

    /** Association « est issu de » : Bail 0..1 vers DemandeLocation 1. */
    public function demandeLocation(): BelongsTo
    {
        return $this->belongsTo(DemandeLocation::class);
    }

    public function annonce(): Annonce
    {
        return $this->demandeLocation->annonce;
    }

    public function bienConcerne(): Bien
    {
        return $this->annonce()->bien;
    }

    public function locataire(): Client
    {
        return $this->demandeLocation->client;
    }

    public function proprietaire(): Proprietaire
    {
        return $this->bienConcerne()->proprietaire;
    }

    public function signataires(): array
    {
        return [$this->proprietaire(), $this->locataire()];
    }

    /** Association « règle » : PaiementLoyer 0..* vers Bail 1. */
    public function paiementsLoyer(): HasMany
    {
        return $this->hasMany(PaiementLoyer::class, 'bail_id');
    }

    /** Association « couvre » : PaiementCaution 0..1 vers Bail 1. */
    public function paiementCaution(): HasOne
    {
        return $this->hasOne(PaiementCaution::class, 'bail_id')->where('statut', StatutPaiement::REUSSI);
    }

    /** Composition Bail 1 vers EtatDesLieux 0..2. */
    public function etatsDesLieux(): HasMany
    {
        return $this->hasMany(EtatDesLieux::class, 'bail_id');
    }

    public function dateFin(): Carbon
    {
        return $this->date_debut->copy()->addMonthsNoOverflow($this->duree_mois);
    }

    /** Premier jour de chaque mois couvert par le bail. @return list<Carbon> */
    public function moisDuBail(): array
    {
        $debut = $this->date_debut->copy()->startOfMonth();

        return array_map(fn (int $i): Carbon => $debut->copy()->addMonthsNoOverflow($i), range(0, $this->duree_mois - 1));
    }

    /** Premier mois pas encore réglé, null quand tout est payé. */
    public function prochainMoisDu(): ?Carbon
    {
        $payes = $this->paiementsLoyer()->where('statut', StatutPaiement::REUSSI)->pluck('mois_concerne')
            ->map(fn ($d): string => Carbon::parse($d)->format('Y-m'))->all();

        return collect($this->moisDuBail())->first(fn (Carbon $m): bool => ! in_array($m->format('Y-m'), $payes, true));
    }

    /** Opération du diagramme : date limite du prochain loyer à payer. */
    public function prochaineEcheance(): ?Carbon
    {
        return $this->prochainMoisDu()?->copy()->day($this->jour_echeance);
    }

    public function resilier(string $motif): void
    {
        $this->resilierContrat($motif);
        $this->bienConcerne()->update(['statut' => StatutBien::DISPONIBLE]);
    }

    protected function apresSignature(): void
    {
        $this->annonce()->marquerConclue();
    }
}
