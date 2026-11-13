<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contrat extends Model
{
    protected $table = 'contrats';

    protected $fillable = [
        'bien_id',
        'demande_id',
        'proprietaire_id',
        'locataire_id',
        'type',
        'date_debut',
        'date_fin',
        'duree_mois',
        'loyer_mensuel',
        'caution',
        'prix_vente',
        'fichier_pdf',
        'statut',
        'signe_proprietaire',
        'signe_locataire',
        'signe_proprietaire_le',
        'signe_locataire_le',
    ];

    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'loyer_mensuel' => 'decimal:2',
        'caution' => 'decimal:2',
        'signe_proprietaire' => 'boolean',
        'signe_locataire' => 'boolean',
        'signe_proprietaire_le' => 'datetime',
        'signe_locataire_le' => 'datetime',
    ];

    public function bien()
    {
        return $this->belongsTo(Bien::class);
    }

    public function proprietaire()
    {
        return $this->belongsTo(User::class, 'proprietaire_id');
    }

    public function locataire()
    {
        return $this->belongsTo(User::class, 'locataire_id');
    }
}