<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EtatDesLieux extends Model
{
    protected $table = 'etats_des_lieux';

    protected $fillable = [
        'contrat_id',
        'type',
        'pieces',
        'observations',
        'photos',
        'valide_locataire',
        'valide_le',
        'remarque_locataire',
    ];

    protected $casts = [
        'pieces' => 'array',
        'photos' => 'array',
        'valide_locataire' => 'boolean',
        'valide_le' => 'datetime',
    ];

    protected $appends = ['photos_urls'];

    public function getPhotosUrlsAttribute(): array
    {
        return collect($this->photos ?? [])
            ->map(fn ($path) => asset('storage/' . $path))
            ->all();
    }

    public function contrat()
    {
        return $this->belongsTo(Contrat::class);
    }
}