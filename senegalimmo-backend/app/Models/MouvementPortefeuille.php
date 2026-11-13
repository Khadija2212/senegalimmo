<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MouvementPortefeuille extends Model
{
    protected $table = 'mouvements_portefeuille';

    protected $fillable = ['user_id', 'type', 'montant', 'solde_apres', 'libelle'];

    protected $casts = [
        'montant'     => 'decimal:2',
        'solde_apres' => 'decimal:2',
    ];
}