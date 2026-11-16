<?php

namespace App\Models;

use App\Enums\TypeTransaction;
use Illuminate\Database\Eloquent\Model;

/** RegleCommission du diagramme : taux et minimum fixés par l'administrateur. */
class RegleCommission extends Model
{
    private const POURCENT = 100;

    protected $table = 'regles_commission';

    protected $fillable = ['type_transaction', 'taux', 'montant_minimum', 'actif_depuis'];

    protected $casts = [
        'type_transaction' => TypeTransaction::class,
        'taux' => 'float',
        'montant_minimum' => 'integer',
        'actif_depuis' => 'date',
    ];

    /** La règle en vigueur aujourd'hui pour ce type de transaction. */
    public static function enVigueur(TypeTransaction $type): self
    {
        return self::where('type_transaction', $type->value)
            ->whereDate('actif_depuis', '<=', today())
            ->orderByDesc('actif_depuis')
            ->orderByDesc('id')
            ->firstOrFail();
    }

    /** Commission en FCFA : le taux appliqué, jamais sous le minimum, jamais au-dessus du montant. */
    public function calculer(int $montant): int
    {
        if ($this->taux <= 0 && $this->montant_minimum <= 0) {
            return 0;
        }
        $commission = max((int) round($montant * $this->taux / self::POURCENT), $this->montant_minimum);

        return min($commission, $montant);
    }
}
