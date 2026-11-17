<?php

namespace App\Models;

use App\Enums\MotifSignalement;
use App\Enums\StatutSignalement;
use App\Models\Concerns\ExigeStatut;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Signalement du diagramme : émis par un Client, concerne 0..1 Annonce, traité par un Administrateur. */
class Signalement extends Model
{
    use ExigeStatut, HasUuids;

    protected $table = 'signalements';

    protected $fillable = ['annonce_id', 'motif', 'description', 'statut', 'resolution', 'traite_le'];

    protected $attributes = ['statut' => 'ouvert'];

    protected $casts = ['motif' => MotifSignalement::class, 'statut' => StatutSignalement::class, 'traite_le' => 'datetime'];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function annonce(): BelongsTo
    {
        return $this->belongsTo(Annonce::class);
    }

    /** Association « traite » : Administrateur 0..1 vers Signalement 0..*. */
    public function administrateur(): BelongsTo
    {
        return $this->belongsTo(Administrateur::class, 'administrateur_id');
    }

    public function resoudre(string $resolution): void
    {
        $this->exigerStatut(StatutSignalement::OUVERT, StatutSignalement::EN_COURS);
        $this->fill(['statut' => StatutSignalement::RESOLU, 'resolution' => $resolution, 'traite_le' => now()])->save();
    }
}
