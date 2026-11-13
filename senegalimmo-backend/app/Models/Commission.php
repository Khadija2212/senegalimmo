<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Commission extends Model
{
    protected $table = 'commissions';

    protected $fillable = [
        'mandat_id',
        'bien_id',
        'agence_id',
        'agent_id',
        'proprietaire_id',
        'contrat_id',
        'promesse_id',
        'type',
        'base',
        'taux',
        'montant',
        'statut',
        'reglee_le',
    ];

    protected $casts = [
        'base'      => 'decimal:2',
        'taux'      => 'decimal:2',
        'montant'   => 'decimal:2',
        'reglee_le' => 'datetime',
    ];

    public function bien()
    {
        return $this->belongsTo(Bien::class);
    }

    public function agence()
    {
        return $this->belongsTo(User::class, 'agence_id');
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    public function proprietaire()
    {
        return $this->belongsTo(User::class, 'proprietaire_id');
    }
}