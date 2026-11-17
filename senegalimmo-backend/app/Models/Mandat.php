<?php

namespace App\Models;

use App\Enums\StatutContrat;
use App\Enums\TypeMandat;
use App\Exceptions\OperationRefusee;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Mandat du diagramme : le propriétaire confie un Bien à un Agent, contre une commission. */
class Mandat extends Contrat
{
    private const POURCENT = 100;

    protected function casts(): array
    {
        return ['type' => TypeMandat::class, 'taux_commission' => 'float', 'date_fin' => 'date'];
    }

    protected function prefixeReference(): string
    {
        return 'SI-M-';
    }

    protected function vueDocument(): string
    {
        return 'pdf.mandat';
    }

    /** Association « porte sur » : Mandat 0..* vers Bien 1. */
    public function bien(): BelongsTo
    {
        return $this->belongsTo(Bien::class);
    }

    /** Association « mandataire » : Mandat 0..* vers Agent 1. */
    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class, 'agent_id');
    }

    public function bienConcerne(): Bien
    {
        return $this->bien;
    }

    public function signataires(): array
    {
        return [$this->bien->proprietaire, $this->agent];
    }

    public function scopeActifs(Builder $q): Builder
    {
        return $q->where('statut', StatutContrat::SIGNE)->whereDate('date_debut', '<=', today())->whereDate('date_fin', '>=', today());
    }

    /** Opération du diagramme : signé et dans sa période de validité. */
    public function estActif(): bool
    {
        return $this->statut === StatutContrat::SIGNE && today()->betweenIncluded($this->date_debut, $this->date_fin);
    }

    /** Opération du diagramme : prolonge le mandat signé ou expiré de quelques mois. */
    public function renouveler(int $dureeMois): void
    {
        $this->exigerStatut(StatutContrat::SIGNE, StatutContrat::EXPIRE);
        if ($dureeMois <= 0) {
            throw new OperationRefusee('La durée de renouvellement doit être positive.');
        }
        $depart = $this->date_fin->isPast() ? today() : $this->date_fin;
        $this->update(['date_fin' => $depart->copy()->addMonthsNoOverflow($dureeMois), 'statut' => StatutContrat::SIGNE]);
    }

    public function resilier(string $motif): void
    {
        $this->resilierContrat($motif);
    }

    /** Commission due à l'agent sur un montant encaissé par le propriétaire. */
    public function commissionSur(int $montant): int
    {
        return (int) round($montant * $this->taux_commission / self::POURCENT);
    }
}
