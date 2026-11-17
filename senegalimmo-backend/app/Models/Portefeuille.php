<?php

namespace App\Models;

use App\Enums\TypeEcriture;
use App\Exceptions\OperationRefusee;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

/**
 * Portefeuille du diagramme : détenu par un Propriétaire ou un Agent (0..1), jamais par un Client.
 * Chaque mouvement verrouille la ligne, met à jour les soldes et écrit une Ecriture.
 */
class Portefeuille extends Model
{
    /** Rôles qui détiennent un portefeuille (association « détient » du diagramme). */
    public const ROLES = ['proprietaire', 'agent'];

    protected $table = 'portefeuilles';

    protected $fillable = ['user_id', 'solde_disponible', 'solde_en_attente', 'mis_a_jour_le'];

    protected $casts = [
        'solde_disponible' => 'integer',
        'solde_en_attente' => 'integer',
        'mis_a_jour_le' => 'datetime',
    ];

    /** Le portefeuille de ce compte, créé à la première utilisation. */
    public static function de(Compte $u): self
    {
        if (!in_array($u->role, self::ROLES, true)) {
            throw new OperationRefusee('Le portefeuille est réservé aux propriétaires et aux agents immobiliers.', OperationRefusee::INTERDIT);
        }

        return self::firstOrCreate(['user_id' => $u->id], ['mis_a_jour_le' => now()]);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'user_id')->withoutGlobalScope('role');
    }

    public function ecritures(): HasMany
    {
        return $this->hasMany(Ecriture::class);
    }

    public function retraits(): HasMany
    {
        return $this->hasMany(Retrait::class);
    }

    /** Opération du diagramme : l'argent d'un paiement réussi devient disponible. */
    public function crediter(int $montant, Paiement $p): void
    {
        $type = $p instanceof PaiementIndemnite ? TypeEcriture::CREDIT_VENTE : TypeEcriture::CREDIT_LOYER;
        $this->mouvement($type, $montant, 0, $p->libelle() . ' (' . $p->reference . ')', ['paiement_id' => $p->id]);
    }

    /** Opération du diagramme : un retrait demandé met le montant de côté. */
    public function bloquer(int $montant, ?Retrait $r = null): void
    {
        $this->mouvement(TypeEcriture::BLOCAGE_RETRAIT, -$montant, $montant, self::libelleRetrait('Retrait demandé', $r), self::lien($r));
    }

    /** Opération du diagramme : le retrait versé sort définitivement du solde en attente. */
    public function debiter(int $montant, ?Retrait $r = null): void
    {
        $this->mouvement(TypeEcriture::DEBIT_RETRAIT, 0, -$montant, self::libelleRetrait('Retrait versé', $r), self::lien($r), -$montant);
    }

    /** Un retrait rejeté rend le montant au solde disponible (écriture DEBLOCAGE). */
    public function debloquer(int $montant, ?Retrait $r = null): void
    {
        $this->mouvement(TypeEcriture::DEBLOCAGE, $montant, -$montant, self::libelleRetrait('Retrait annulé', $r), self::lien($r));
    }

    private static function libelleRetrait(string $texte, ?Retrait $r): string
    {
        return $r ? $texte . ' n°' . $r->id : $texte;
    }

    /** @return array<string, int> */
    private static function lien(?Retrait $r): array
    {
        return $r ? ['retrait_id' => $r->id] : [];
    }

    /** Commission versée d'un portefeuille à un autre (écriture COMMISSION_AGENT des deux côtés). */
    public function verserCommission(self $agent, int $montant, string $libelle): void
    {
        DB::transaction(function () use ($agent, $montant, $libelle): void {
            $this->mouvement(TypeEcriture::COMMISSION_AGENT, -$montant, 0, 'Commission payée : ' . $libelle);
            $agent->mouvement(TypeEcriture::COMMISSION_AGENT, $montant, 0, 'Commission reçue : ' . $libelle);
        });
    }

    /**
     * @param int $varDisponible variation du solde disponible
     * @param int $varAttente variation du solde en attente
     * @param array<string, int> $liens paiement ou retrait concerné
     * @param int|null $montantEcrit montant inscrit, si différent de la variation du disponible
     */
    private function mouvement(TypeEcriture $type, int $varDisponible, int $varAttente, string $libelle, array $liens = [], ?int $montantEcrit = null): void
    {
        DB::transaction(function () use ($type, $varDisponible, $varAttente, $libelle, $liens, $montantEcrit): void {
            $p = self::lockForUpdate()->findOrFail($this->id);
            if ($p->solde_disponible + $varDisponible < 0 || $p->solde_en_attente + $varAttente < 0) {
                throw new OperationRefusee('Solde insuffisant.');
            }

            $p->update([
                'solde_disponible' => $p->solde_disponible + $varDisponible,
                'solde_en_attente' => $p->solde_en_attente + $varAttente,
                'mis_a_jour_le' => now(),
            ]);
            $p->ecritures()->create($liens + [
                'type' => $type,
                'montant' => $montantEcrit ?? $varDisponible,
                'solde_apres' => $p->solde_disponible,
                'libelle' => $libelle,
                'date' => now(),
            ]);
            $this->setRawAttributes($p->getAttributes(), true);
        });
    }
}
