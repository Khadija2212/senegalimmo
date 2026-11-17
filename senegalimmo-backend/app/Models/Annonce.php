<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Annonce extends Model
{
    protected $table = 'annonces';

    protected $fillable = [
        'bien_id',
        'auteur_id',
        'titre',
        'description',
        'prix',
        'photos',
        'type_transaction',
        'statut',
        'bien_verifie',
        'nombre_vues',
        'date_expiration',
        'motif_rejet',
    ];

    protected $casts = [
        'prix' => 'decimal:2',
        'photos' => 'array',
        'bien_verifie' => 'boolean',
        'date_expiration' => 'datetime',
    ];

    public function bien()
    {
        return $this->belongsTo(Bien::class);
    }

    public function auteur()
    {
        return $this->belongsTo(Client::class, 'auteur_id')->withoutGlobalScope('role');
    }
}