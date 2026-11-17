<?php

namespace App\Models;

use App\Enums\StatutAnnonce;
use App\Enums\StatutBien;
use App\Enums\TypeTransaction;
use App\Exceptions\OperationRefusee;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

/** Annonce du diagramme : présente un Bien à la location ou à la vente, peut bénéficier d'une OptionPremium. */
class Annonce extends Model
{
    use HasFactory, HasUuids;

    private const PREFIXE_REFERENCE = 'SI-A-';

    private const LONGUEUR_ALEATOIRE = 5;

    protected $table = 'annonces';

    protected $fillable = [
        'reference', 'type_transaction', 'prix', 'charges', 'caution', 'statut', 'badge_verifie',
        'premium_jusquau', 'nombre_vues', 'publiee_le', 'option_premium_id',
    ];

    protected $attributes = ['statut' => 'en_moderation'];

    protected $casts = [
        'type_transaction' => TypeTransaction::class,
        'statut' => StatutAnnonce::class,
        'prix' => 'integer',
        'charges' => 'integer',
        'caution' => 'integer',
        'badge_verifie' => 'boolean',
        'premium_jusquau' => 'datetime',
        'nombre_vues' => 'integer',
        'publiee_le' => 'datetime',
    ];

    protected $appends = ['est_premium'];

    public static function nouvelleReference(): string
    {
        return self::PREFIXE_REFERENCE.now()->format('ymd').'-'.Str::upper(Str::random(self::LONGUEUR_ALEATOIRE));
    }

    public static function fcfa(int $montant): string
    {
        return number_format($montant, 0, ',', ' ').' FCFA';
    }

    /** Association « présente » : Annonce 0..* vers Bien 1. */
    public function bien(): BelongsTo
    {
        return $this->belongsTo(Bien::class);
    }

    /** Association « bénéficie de » : Annonce 0..* vers OptionPremium 0..1. */
    public function optionPremium(): BelongsTo
    {
        return $this->belongsTo(OptionPremium::class);
    }

    public function scopePubliees(Builder $q): Builder
    {
        return $q->where('annonces.statut', StatutAnnonce::PUBLIEE);
    }

    /** L'annonce est-elle publiée (et du bon type, si précisé) ? Sinon le client ne peut rien y faire. */
    public function exigerOuverte(?TypeTransaction $t = null): void
    {
        if ($this->statut !== StatutAnnonce::PUBLIEE) {
            throw new OperationRefusee("Cette annonce n'est pas disponible.");
        }
        if ($t !== null && $this->type_transaction !== $t) {
            throw new OperationRefusee($t === TypeTransaction::LOCATION ? "Ce bien n'est pas proposé à la location." : "Ce bien n'est pas proposé à la vente.");
        }
    }

    /** Opération du diagramme : l'annonce approuvée devient visible et son bien disponible. */
    public function publier(): void
    {
        $this->exigerStatut(StatutAnnonce::EN_MODERATION, StatutAnnonce::SUSPENDUE);
        $this->update(['statut' => StatutAnnonce::PUBLIEE, 'publiee_le' => $this->publiee_le ?? now()]);
        $this->bien->update(['statut' => StatutBien::DISPONIBLE]);
    }

    public function rejeter(): void
    {
        $this->exigerStatut(StatutAnnonce::EN_MODERATION);
        $this->update(['statut' => StatutAnnonce::REJETEE]);
    }

    /** Opération du diagramme. */
    public function suspendre(): void
    {
        $this->exigerStatut(StatutAnnonce::PUBLIEE, StatutAnnonce::EN_MODERATION);
        $this->update(['statut' => StatutAnnonce::SUSPENDUE]);
    }

    /** Opération du diagramme : modifier une annonce publiée la renvoie en modération. */
    public function modifier(int $prix, string $description): void
    {
        $this->exigerStatut(...StatutAnnonce::enCours());
        $this->bien->update(['description' => $description]);
        $this->update(['prix' => $prix, 'statut' => StatutAnnonce::EN_MODERATION]);
    }

    /** Opération du diagramme : la transaction est faite, le bien est loué ou vendu. */
    public function marquerConclue(): void
    {
        $location = $this->type_transaction === TypeTransaction::LOCATION;
        $this->update(['statut' => $location ? StatutAnnonce::LOUEE : StatutAnnonce::VENDUE]);
        $this->bien->update(['statut' => $location ? StatutBien::LOUE : StatutBien::VENDU]);
    }

    /** Opération du diagramme : prolonge la mise en avant de la durée de l'option. */
    public function activerPremium(OptionPremium $o): void
    {
        if (! $o->active) {
            throw new OperationRefusee("Cette option premium n'est plus proposée.");
        }
        $this->exigerOuverte();
        $depart = $this->estPremium() ? $this->premium_jusquau : now();
        $this->optionPremium()->associate($o);
        $this->update(['premium_jusquau' => $depart->copy()->addDays($o->duree_jours)]);
    }

    public function estPremium(): bool
    {
        return $this->premium_jusquau !== null && $this->premium_jusquau->isFuture();
    }

    public function getEstPremiumAttribute(): bool
    {
        return $this->estPremium();
    }

    public function compterVue(): void
    {
        $this->increment('nombre_vues');
    }

    private function exigerStatut(StatutAnnonce ...$attendus): void
    {
        if (! in_array($this->statut, $attendus, true)) {
            throw new OperationRefusee("Cette opération n'est pas possible : l'annonce est ".$this->statut->libelle().'.');
        }
    }
}
