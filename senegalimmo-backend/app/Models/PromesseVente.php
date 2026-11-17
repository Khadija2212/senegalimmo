<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromesseVente extends Model
{
    protected $table = 'promesses_vente';

    protected $fillable = [
        'offre_id',
        'bien_id',
        'vendeur_id',
        'acheteur_id',
        'prix_convenu',
        'indemnite_immobilisation',
        'date_limite',
        'conditions',
        'statut',
        'signe_vendeur',
        'signe_acheteur',
        'signe_vendeur_le',
        'signe_acheteur_le',
    ];

    protected $casts = [
        'prix_convenu'             => 'decimal:2',
        'indemnite_immobilisation' => 'decimal:2',
        'date_limite'              => 'date',
        'signe_vendeur'            => 'boolean',
        'signe_acheteur'           => 'boolean',
        'signe_vendeur_le'         => 'datetime',
        'signe_acheteur_le'        => 'datetime',
    ];

    public function bien()
    {
        return $this->belongsTo(Bien::class);
    }

    public function vendeur()
    {
        return $this->belongsTo(Proprietaire::class, 'vendeur_id');
    }

    public function acheteur()
    {
        return $this->belongsTo(Client::class, 'acheteur_id');
    }

    public function offre()
    {
        return $this->belongsTo(OffreAchat::class, 'offre_id');
    }
}