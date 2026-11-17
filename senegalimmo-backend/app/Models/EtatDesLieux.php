<?php

namespace App\Models;

use App\Enums\TypeEtatDesLieux;
use App\Exceptions\OperationRefusee;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/** EtatDesLieux du diagramme : d'entrée ou de sortie d'un Bail (composition), illustré de Media. */
class EtatDesLieux extends Model
{
    use HasUuids;

    protected $table = 'etats_des_lieux';

    protected $fillable = ['type', 'date', 'observations', 'releve_compteurs', 'valide_le'];

    protected $casts = ['type' => TypeEtatDesLieux::class, 'date' => 'datetime', 'valide_le' => 'datetime'];

    public function bail(): BelongsTo
    {
        return $this->belongsTo(Bail::class, 'bail_id');
    }

    /** Agrégation « photos » : Media 0..* vers EtatDesLieux 0..*. */
    public function photos(): BelongsToMany
    {
        return $this->belongsToMany(Media::class, 'etat_des_lieux_media', 'etat_des_lieux_id', 'media_id');
    }

    /** Opération du diagramme : le locataire approuve l'état des lieux, une seule fois. */
    public function valider(): void
    {
        if ($this->valide_le !== null) {
            throw new OperationRefusee('Cet état des lieux est déjà validé.');
        }
        $this->update(['valide_le' => now()]);
        $this->bail->proprietaire()->notifier('État des lieux validé', "Le locataire a validé l'état des lieux d'".$this->type->value.'.');
    }
}
