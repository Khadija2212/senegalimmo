<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** OptionPremium du diagramme : mise en avant d'une annonce pendant une durée, gérée par l'administrateur. */
class OptionPremium extends Model
{
    use HasUuids;

    protected $table = 'options_premium';

    protected $fillable = ['libelle', 'duree_jours', 'prix', 'active'];

    protected $casts = ['duree_jours' => 'integer', 'prix' => 'integer', 'active' => 'boolean'];
}
