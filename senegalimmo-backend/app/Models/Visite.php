<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Visite extends Model
{
    protected $table = 'visites';

    protected $fillable = [
        'bien_id',
        'demandeur_id',
        'proprietaire_id',
        'agent_id',
        'date_visite',
        'statut',
        'commentaire',
        'compte_rendu',
    ];

    protected $casts = [
        'date_visite' => 'datetime',
    ];

    public function bien()
    {
        return $this->belongsTo(Bien::class);
    }

    public function demandeur()
    {
        return $this->belongsTo(User::class, 'demandeur_id');
    }

    public function proprietaire()
    {
        return $this->belongsTo(User::class, 'proprietaire_id');
    }

    public function agent()
    {
        return $this->belongsTo(User::class, 'agent_id');
    }
}
