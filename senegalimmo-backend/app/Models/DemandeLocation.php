<?php

namespace App\Models;

use App\Enums\StatutDemande;
use App\Models\Concerns\ExigeStatut;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/** DemandeLocation du diagramme : déposée par un Client, concerne une Annonce, peut donner un Bail. */
class DemandeLocation extends Model
{
    use ExigeStatut, HasUuids;

    protected $table = 'demandes_location';

    protected $fillable = ['annonce_id', 'date_entree_souhaitee', 'duree_mois', 'message', 'statut'];

    protected $attributes = ['statut' => 'en_attente'];

    protected $casts = ['date_entree_souhaitee' => 'date', 'duree_mois' => 'integer', 'statut' => StatutDemande::class];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function annonce(): BelongsTo
    {
        return $this->belongsTo(Annonce::class);
    }

    /** Association « est issu de » : Bail 0..1 vers DemandeLocation 1. */
    public function bail(): HasOne
    {
        return $this->hasOne(Bail::class, 'demande_location_id');
    }

    public function accepter(): void
    {
        $this->exigerStatut(StatutDemande::EN_ATTENTE);
        $this->update(['statut' => StatutDemande::ACCEPTEE]);
        $this->client->notifier('Demande de location acceptée', 'Votre demande pour « '.$this->annonce->bien->titre.' » est acceptée. Le bail va suivre.');
    }

    public function refuser(string $motif): void
    {
        $this->exigerStatut(StatutDemande::EN_ATTENTE);
        $this->update(['statut' => StatutDemande::REFUSEE]);
        $this->client->notifier('Demande de location refusée', 'Votre demande pour « '.$this->annonce->bien->titre.' » est refusée : '.$motif);
    }
}
