<?php

namespace App\Models;

use App\Enums\MethodePaiement;
use App\Enums\StatutPaiement;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Classe abstraite Paiement du diagramme de classes.
 * Les sous-classes partagent la table « paiements », distinguées par la colonne « type ».
 * Le cycle de vie (initier, confirmer, échouer) est porté par le trait CycleDePaiement.
 */
abstract class Paiement extends Model
{
    use CycleDePaiement;

    /** Valeur de la colonne « type » propre à chaque sous-classe. */
    public const TYPE = '';

    /** @var array<string, class-string<Paiement>> */
    public const SOUS_CLASSES = [
        PaiementLoyer::TYPE => PaiementLoyer::class,
        PaiementCaution::TYPE => PaiementCaution::class,
        PaiementIndemnite::TYPE => PaiementIndemnite::class,
    ];

    protected $table = 'paiements';

    protected $fillable = [
        'reference', 'montant', 'frais_service', 'commission', 'methode', 'reference_paytech',
        'statut', 'confirme_le', 'bail_id', 'promesse_id', 'mois_concerne', 'restituable', 'regle_commission_id',
    ];

    protected $casts = [
        'montant' => 'integer',
        'frais_service' => 'integer',
        'commission' => 'integer',
        'methode' => MethodePaiement::class,
        'statut' => StatutPaiement::class,
        'confirme_le' => 'datetime',
        'mois_concerne' => 'date',
        'restituable' => 'boolean',
    ];

    protected $appends = ['libelle', 'type'];

    /** Opération abstraite du diagramme : chaque sous-classe dit ce qu'elle règle. */
    abstract public function libelle(): string;

    /** Qui paie, déduit de l'objet réglé (pas d'association directe, voir le diagramme). */
    abstract public function payeur(): ?Utilisateur;

    /** Qui reçoit l'argent, déduit de l'objet réglé. */
    abstract public function beneficiaire(): ?Utilisateur;

    /** Le bien concerné, pour les reçus et les listes. */
    abstract public function bien(): ?Bien;

    protected static function booted(): void
    {
        if (static::TYPE === '') {
            return;
        }
        static::addGlobalScope('type', fn (Builder $q) => $q->where('paiements.type', static::TYPE));
        static::creating(function (Paiement $p): void {
            $p->setAttribute('type', static::TYPE);
        });
    }

    /** Tous les paiements, chacun chargé dans sa sous-classe. */
    public static function tous(): Builder
    {
        return (new PaiementLoyer())->newQueryWithoutScope('type');
    }

    /** @param object|array<string, mixed> $attributes */
    public function newFromBuilder($attributes = [], $connection = null): Paiement
    {
        $type = is_object($attributes) ? ($attributes->type ?? null) : ($attributes['type'] ?? null);
        $classe = self::SOUS_CLASSES[$type] ?? static::class;

        $modele = (new $classe())->newInstance([], true);
        $modele->setRawAttributes((array) $attributes, true);
        $modele->setConnection($connection ?: $this->getConnectionName());
        $modele->fireModelEvent('retrieved', false);

        return $modele;
    }

    public function getTypeAttribute(): string
    {
        return static::TYPE;
    }

    public function getLibelleAttribute(): string
    {
        return $this->libelle();
    }

    public function regleCommission(): BelongsTo
    {
        return $this->belongsTo(RegleCommission::class);
    }

    /** Composition Paiement 1 vers Recu 0..1 : le reçu atteste ce paiement. */
    public function recu(): HasOne
    {
        return $this->hasOne(Recu::class, 'paiement_id');
    }

    public function estPartie(Compte $u): bool
    {
        return $u->role === 'administrateur' || $this->payeur()?->is($u) || $this->beneficiaire()?->is($u);
    }

    /** Montant crédité au bénéficiaire, une fois la commission de la plateforme retenue. */
    public function montantNet(): int
    {
        return $this->montant - $this->commission;
    }
}
