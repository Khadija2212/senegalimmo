<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DemandeLocation extends Model
{
    protected $table = 'demandes_location';

    protected $fillable = [
        'bien_id',
        'locataire_id',
        'proprietaire_id',
        'message',
        'date_emmenagement',
        'statut',
        'motif_refus',
    ];

    protected $casts = [
        'date_emmenagement' => 'date',
    ];

    public function bien()
    {
        return $this->belongsTo(Bien::class);
    }

    public function locataire()
    {
        return $this->belongsTo(User::class, 'locataire_id');
    }

    public function proprietaire()
    {
        return $this->belongsTo(User::class, 'proprietaire_id');
    }

    public function contrat()
    {
        return $this->hasOne(Contrat::class, 'demande_id');
    }
}