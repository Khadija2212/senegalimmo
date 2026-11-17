<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bien extends Model
{
    protected $table = 'biens';

    protected $fillable = [
        'proprietaire_id',
        'categorie_id',
        'titre',
        'description',
        'type',
        'transaction',
        'prix',
        'surface',
        'chambres',
        'salles_bain',
        'adresse',
        'quartier',
        'ville',
        'latitude',
        'longitude',
        'photos',
        'est_verifie',
        'statut',
    ];

    protected $casts = [
        'prix' => 'decimal:2',
        'latitude' => 'float',
        'longitude' => 'float',
        'est_verifie' => 'boolean',
        'photos' => 'array',
    ];

    protected $appends = ['photos_urls'];

    // URLs complètes des photos, utilisables directement par Angular
    public function getPhotosUrlsAttribute(): array
    {
        return collect($this->photos ?? [])
            ->map(fn ($path) => asset('storage/' . $path))
            ->all();
    }

    public function proprietaire()
    {
        return $this->belongsTo(Proprietaire::class, 'proprietaire_id');
    }

    public function categorie()
    {
        return $this->belongsTo(Categorie::class);
    }

    public function annonces()
    {
        return $this->hasMany(Annonce::class);
    }

    public function favoris()
    {
        return $this->hasMany(Favori::class);
    }

    public function signalements()
    {
        return $this->hasMany(Signalement::class);
    }
}
