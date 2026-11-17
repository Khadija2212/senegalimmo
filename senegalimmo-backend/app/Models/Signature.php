<?php

namespace App\Models;

use App\Enums\StatutSignature;
use App\Models\Concerns\ExigeStatut;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Signature du diagramme : l'accord d'un signataire sur un Contrat, suivie par le ServiceSignature («use»). */
class Signature extends Model
{
    use ExigeStatut, HasUuids;

    protected $table = 'signatures';

    protected $fillable = ['signataire_id', 'statut', 'reference_service', 'signe_le', 'adresse_ip'];

    protected $attributes = ['statut' => 'en_attente'];

    protected $casts = ['statut' => StatutSignature::class, 'signe_le' => 'datetime'];

    public function contrat(): BelongsTo
    {
        return $this->belongsTo(Bail::class, 'contrat_id')->withoutGlobalScope('heritage');
    }

    public function signataire(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'signataire_id')->withoutGlobalScope('heritage');
    }

    /** Opération du diagramme : rappelle au signataire que sa signature est attendue. */
    public function relancer(): void
    {
        $this->exigerStatut(StatutSignature::EN_ATTENTE);
        $this->signataire->notifier('Rappel : contrat à signer', 'Le contrat '.$this->contrat->reference.' attend toujours votre signature.');
    }

    /** Reporte l'état donné par le service de signature. */
    public function constater(StatutSignature $statut): void
    {
        if ($statut !== $this->statut) {
            $this->update(['statut' => $statut, 'signe_le' => $statut === StatutSignature::SIGNEE ? ($this->signe_le ?? now()) : null]);
        }
    }
}
