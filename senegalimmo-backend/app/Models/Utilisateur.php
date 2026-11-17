<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Classe abstraite Utilisateur du diagramme : toute personne inscrite qui n'est pas
 * administrateur. Généralisée par Client, Proprietaire et Agent.
 */
abstract class Utilisateur extends Compte
{
    /**
     * Opération abstraite du diagramme : chaque profil a ses propres indicateurs.
     *
     * @return array<string, int|float>
     */
    abstract public function indicateursTableauDeBord(): array;

    public function messagesEnvoyes(): HasMany
    {
        return $this->hasMany(Message::class, 'expediteur_id');
    }

    public function messagesRecus(): HasMany
    {
        return $this->hasMany(Message::class, 'destinataire_id');
    }

    public function notationsRecues(): HasMany
    {
        return $this->hasMany(Notation::class, 'note_id');
    }

    protected function messagesNonLus(): int
    {
        return Message::where('destinataire_id', $this->id)->where('lu', false)->count();
    }
}
