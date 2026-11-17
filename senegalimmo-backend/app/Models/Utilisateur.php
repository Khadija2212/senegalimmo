<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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

    /** Association « participe » : Utilisateur 2..* vers Conversation 0..*. */
    public function conversations(): BelongsToMany
    {
        return $this->belongsToMany(Conversation::class, 'conversation_participants', 'utilisateur_id', 'conversation_id');
    }

    /** Opération du diagramme : seul un participant écrit dans la conversation. */
    public function envoyerMessage(Conversation $c, string $contenu, ?string $pieceJointeUrl = null): Message
    {
        $m = new Message(['contenu' => $contenu, 'piece_jointe_url' => $pieceJointeUrl]);
        $m->expediteur()->associate($this);
        $c->ajouterMessage($m);

        return $m;
    }

    protected function apresConnexion(): void
    {
        $this->forceFill(['derniere_connexion' => now()])->save();
    }

    protected function messagesNonLus(): int
    {
        return Message::whereIn('conversation_id', $this->conversations()->select('conversations.id'))
            ->where('expediteur_id', '!=', $this->id)
            ->whereNull('lu_le')
            ->count();
    }
}
