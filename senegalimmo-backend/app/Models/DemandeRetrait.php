<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DemandeRetrait extends Model
{
    protected $table = 'demandes_retrait';

    protected $fillable = [
        'user_id',
        'montant',
        'methode',
        'numero_telephone',
        'statut',
        'motif_rejet',
        'traitee_le',
        'preuve',
        'reference_transfert',
    ];

    protected $hidden = ['preuve'];

    protected $casts = [
        'montant'    => 'decimal:2',
        'traitee_le' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}