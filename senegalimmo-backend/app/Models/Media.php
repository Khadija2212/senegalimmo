<?php

namespace App\Models;

use App\Contracts\ServiceStockage;
use App\Enums\TypeMedia;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Media du diagramme : fichier d'un Bien rangé par le ServiceStockage («use»). */
class Media extends Model
{
    use HasUuids;

    private const DUREE_LIEN_MIN = 60;

    protected $table = 'medias';

    protected $fillable = ['url', 'type', 'ordre', 'televerse_le'];

    protected $casts = ['type' => TypeMedia::class, 'ordre' => 'integer', 'televerse_le' => 'datetime'];

    protected $appends = ['lien'];

    public function bien(): BelongsTo
    {
        return $this->belongsTo(Bien::class);
    }

    /** Range le fichier et crée le média, sans l'attacher encore à un bien. */
    public static function depuisFichier(string $contenu, string $nom, TypeMedia $type): self
    {
        $url = app(ServiceStockage::class)->televerser($contenu, $nom);

        return new self(['url' => $url, 'type' => $type, 'televerse_le' => now()]);
    }

    /** Adresse de lecture temporaire. */
    public function getLienAttribute(): string
    {
        return app(ServiceStockage::class)->urlSignee($this->url, self::DUREE_LIEN_MIN);
    }

    /** Opération du diagramme : le fichier quitte le stockage, puis le média disparaît. */
    public function supprimer(): void
    {
        app(ServiceStockage::class)->supprimer($this->url);
        $this->delete();
    }
}
