<?php

namespace App\Models;

use App\Enums\MethodePaiement;
use App\Enums\StatutRetrait;
use App\Exceptions\OperationRefusee;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

/**
 * Retrait du diagramme : financé par un Portefeuille, validé par un Administrateur,
 * versé par la PasserellePaiement. Cycle : DEMANDE, puis APPROUVE, puis VERSE ; ou REJETE.
 */
class Retrait extends Model
{
    protected $table = 'retraits';

    protected $fillable = [
        'montant', 'methode', 'numero_beneficiaire', 'statut', 'reference_paytech',
        'motif_rejet', 'validateur_id', 'demande_le', 'traite_le',
    ];

    protected $casts = [
        'montant' => 'integer',
        'methode' => MethodePaiement::class,
        'statut' => StatutRetrait::class,
        'demande_le' => 'datetime',
        'traite_le' => 'datetime',
    ];

    public function portefeuille(): BelongsTo
    {
        return $this->belongsTo(Portefeuille::class);
    }

    /** Association « Administrateur valide Retrait » (0..1). */
    public function validateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validateur_id');
    }

    public function approuver(User $administrateur): void
    {
        $this->exigerStatut(StatutRetrait::DEMANDE);
        $this->update(['statut' => StatutRetrait::APPROUVE, 'validateur_id' => $administrateur->id, 'traite_le' => now()]);
    }

    /** Rejeté avant ou pendant le versement : le montant bloqué redevient disponible. */
    public function rejeter(string $motif, ?User $administrateur = null): void
    {
        DB::transaction(function () use ($motif, $administrateur): void {
            $r = self::lockForUpdate()->findOrFail($this->id);
            $r->exigerStatut(StatutRetrait::DEMANDE, StatutRetrait::APPROUVE);
            $r->update([
                'statut' => StatutRetrait::REJETE,
                'motif_rejet' => $motif,
                'validateur_id' => $r->validateur_id ?? $administrateur?->id,
                'traite_le' => now(),
            ]);
            $r->portefeuille->debloquer($r->montant, $r);
            $this->setRawAttributes($r->getAttributes(), true);
        });
    }

    /** Le prestataire confirme le versement : l'argent sort du solde en attente. */
    public function marquerVerse(string $ref): void
    {
        DB::transaction(function () use ($ref): void {
            $r = self::lockForUpdate()->findOrFail($this->id);
            if ($r->statut === StatutRetrait::VERSE) {
                return;
            }
            $r->exigerStatut(StatutRetrait::APPROUVE);
            $r->update(['statut' => StatutRetrait::VERSE, 'reference_paytech' => $ref, 'traite_le' => now()]);
            $r->portefeuille->debiter($r->montant, $r);
            $this->setRawAttributes($r->getAttributes(), true);
        });
    }

    private function exigerStatut(StatutRetrait ...$attendus): void
    {
        if (!in_array($this->statut, $attendus, true)) {
            throw new OperationRefusee('Ce retrait a déjà été traité.');
        }
    }
}
