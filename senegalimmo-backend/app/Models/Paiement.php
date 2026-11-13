<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Paiement extends Model
{
    protected $table = 'paiements';

    protected $fillable = [
        'contrat_id',
        'promesse_id',
        'payeur_id',
        'beneficiaire_id',
        'montant',
        'methode',
        'type',
        'reference',
        'statut',
        'date_paiement',
        'token_paytech',
        'periode',
    ];

    protected $casts = [
        'montant' => 'decimal:2',
        'date_paiement' => 'datetime',
    ];

    public function contrat()
    {
        return $this->belongsTo(Contrat::class);
    }

    public function promesse()
    {
        return $this->belongsTo(PromesseVente::class, 'promesse_id');
    }

    public function payeur()
    {
        return $this->belongsTo(User::class, 'payeur_id');
    }

    public function beneficiaire()
    {
        return $this->belongsTo(User::class, 'beneficiaire_id');
    }
}
