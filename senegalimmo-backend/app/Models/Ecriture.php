<?php

namespace App\Models;

use App\Enums\TypeEcriture;
use Illuminate\Database\Eloquent\Model;

/**
 * Ecriture du diagramme : une ligne de l'historique d'un Portefeuille (composition).
 * « montant » est signé : positif quand l'argent entre, négatif quand il sort.
 * Les écritures de blocage et de déblocage touchent le solde disponible ; le débit
 * d'un retrait versé touche le solde en attente. « solde_apres » est le solde disponible.
 */
class Ecriture extends Model
{
    protected $table = 'ecritures';

    protected $fillable = ['type', 'montant', 'solde_apres', 'libelle', 'date', 'paiement_id', 'retrait_id'];

    protected $casts = [
        'type' => TypeEcriture::class,
        'montant' => 'integer',
        'solde_apres' => 'integer',
        'date' => 'datetime',
    ];
}
