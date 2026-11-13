<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mandat extends Model
{
    protected $table = 'mandats';

    protected $fillable = [
        'bien_id',
        'proprietaire_id',
        'agence_id',
        'agent_id',
        'type',
        'commission_pct',
        'date_debut',
        'date_fin',
        'statut',
        'motif_refus',
    ];

    protected $casts = [
        'commission_pct' => 'decimal:2',
        'date_debut'     => 'date',
        'date_fin'       => 'date',
    ];

    public function bien()
    {
        return $this->belongsTo(Bien::class);
    }

    public function proprietaire()
    {
        return $this->belongsTo(User::class, 'proprietaire_id');
    }

    public function agence()
    {
        return $this->belongsTo(User::class, 'agence_id');
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }
}