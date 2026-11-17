<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OffreAchat extends Model
{
    protected $table = 'offres_achat';

    protected $fillable = [
        'bien_id',
        'acheteur_id',
        'proprietaire_id',
        'montant_offre',
        'montant_contre',
        'montant_final',
        'message',
        'statut',
        'motif_refus',
    ];

    protected $casts = [
        'montant_offre'  => 'decimal:2',
        'montant_contre' => 'decimal:2',
        'montant_final'  => 'decimal:2',
    ];

    public function bien()
    {
        return $this->belongsTo(Bien::class);
    }

    public function acheteur()
    {
        return $this->belongsTo(Client::class, 'acheteur_id');
    }

    public function proprietaire()
    {
        return $this->belongsTo(Proprietaire::class, 'proprietaire_id');
    }

    public function promesse()
    {
        return $this->hasOne(PromesseVente::class, 'offre_id');
    }
}