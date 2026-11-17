<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Message du diagramme : composant d'une Conversation, envoyé par un Utilisateur. */
class Message extends Model
{
    use HasUuids;

    protected $table = 'messages';

    protected $fillable = ['contenu', 'piece_jointe_url', 'envoye_le', 'lu_le'];

    protected $casts = ['envoye_le' => 'datetime', 'lu_le' => 'datetime'];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /** Association « envoie » : Message 0..* vers Utilisateur 1. */
    public function expediteur(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'expediteur_id')->withoutGlobalScope('heritage');
    }

    public function marquerLu(): void
    {
        if ($this->lu_le === null) {
            $this->update(['lu_le' => now()]);
        }
    }
}
