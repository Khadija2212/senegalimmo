<?php

namespace App\Models;

use App\Enums\NiveauInteret;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** CompteRendu du diagramme : rédigé par l'agent après une Visite (composition). */
class CompteRendu extends Model
{
    use HasUuids;

    protected $table = 'comptes_rendus';

    protected $fillable = ['contenu', 'interet_client', 'redige_le'];

    protected $casts = ['interet_client' => NiveauInteret::class, 'redige_le' => 'datetime'];

    public function visite(): BelongsTo
    {
        return $this->belongsTo(Visite::class);
    }
}
