<?php

namespace App\Models;

use App\Exceptions\OperationRefusee;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;

/** Conversation du diagramme : 2..* participants, à propos de 0..1 Annonce, composée de Messages. */
class Conversation extends Model
{
    use HasUuids;

    protected $table = 'conversations';

    protected $fillable = ['annonce_id', 'dernier_message_le'];

    protected $casts = ['dernier_message_le' => 'datetime'];

    /** Association « participe » : Conversation 0..* vers Utilisateur 2..*. */
    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(Client::class, 'conversation_participants', 'conversation_id', 'utilisateur_id')->withoutGlobalScope('heritage');
    }

    /** Association « à propos de » : Conversation 0..* vers Annonce 0..1. */
    public function annonce(): BelongsTo
    {
        return $this->belongsTo(Annonce::class);
    }

    /** Composition Conversation 1 vers Message 0..*. */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Dernier message, pour l'extrait affiché dans la liste des conversations.
     * Tri par date plutôt que latestOfMany : Postgres n'a pas de MAX sur les UUID.
     */
    public function dernierMessage(): HasOne
    {
        return $this->hasOne(Message::class)->orderByDesc('envoye_le');
    }

    /** La conversation de ces deux utilisateurs sur cette annonce, créée si elle n'existe pas. */
    public static function entre(Utilisateur $a, Utilisateur $b, ?Annonce $annonce): self
    {
        $existante = self::where('annonce_id', $annonce?->id)
            ->whereHas('participants', fn ($q) => $q->whereKey($a->id))
            ->whereHas('participants', fn ($q) => $q->whereKey($b->id))
            ->first();

        return $existante ?? DB::transaction(function () use ($a, $b, $annonce): self {
            $c = self::create(['annonce_id' => $annonce?->id]);
            $c->participants()->attach([$a->id, $b->id]);

            return $c;
        });
    }

    public function aPourParticipant(Compte $c): bool
    {
        return $this->participants()->whereKey($c->id)->exists();
    }

    /** Opération du diagramme : seul un participant écrit ; les autres sont prévenus. */
    public function ajouterMessage(Message $m): void
    {
        if (! $this->aPourParticipant($m->expediteur)) {
            throw new OperationRefusee('Vous ne participez pas à cette conversation.', OperationRefusee::INTERDIT);
        }
        $m->envoye_le = now();
        $this->messages()->save($m);
        $this->update(['dernier_message_le' => $m->envoye_le]);
        $this->participants()->whereKeyNot($m->expediteur_id)->get()
            ->each(fn (Compte $c) => $c->notifier('Nouveau message', $m->expediteur->nomComplet().' vous a écrit.'));
    }

    /** Opération du diagramme : messages reçus et pas encore lus par cet utilisateur. */
    public function nonLus(Utilisateur $u): int
    {
        return $this->messages()->where('expediteur_id', '!=', $u->id)->whereNull('lu_le')->count();
    }
}
