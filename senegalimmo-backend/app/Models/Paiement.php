<?php

namespace App\Models;

use App\Enums\MethodePaiement;
use App\Enums\StatutPaiement;
use App\Models\Concerns\HeritageTableUnique;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
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
    use CycleDePaiement, HasUuids, HeritageTableUnique;

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

    protected static function colonneDiscriminante(): string
    {
        return 'type';
    }

    public static function sousClasses(): array
    {
        return ['loyer' => PaiementLoyer::class, 'caution' => PaiementCaution::class, 'indemnite' => PaiementIndemnite::class];
    }

    /** Les paiements versés par ce client, ou reçus par ce propriétaire. */
    public static function concernant(Utilisateur $u): Builder
    {
        $client = $u instanceof Client;
        $colonne = $client ? 'client_id' : 'proprietaire_id';
        $baux = Bail::whereHas($client ? 'demandeLocation' : 'demandeLocation.annonce.bien', fn (Builder $q) => $q->where($colonne, $u->id))->select('contrats.id');
        $promesses = PromesseVente::whereHas($client ? 'offreAchat' : 'offreAchat.annonce.bien', fn (Builder $q) => $q->where($colonne, $u->id))->select('contrats.id');

        return static::tous()->where(fn (Builder $q) => $q->whereIn('bail_id', $baux)->orWhereIn('promesse_id', $promesses));
    }

    public function getTypeAttribute(): string
    {
        return (string) static::valeurDiscriminante();
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
        return $u instanceof Administrateur || $this->payeur()?->is($u) || $this->beneficiaire()?->is($u);
    }

    /** Montant crédité au bénéficiaire, une fois la commission de la plateforme retenue. */
    public function montantNet(): int
    {
        return $this->montant - $this->commission;
    }
}
