<?php

namespace App\Models;

use App\Contracts\ServiceNotification;
use App\Enums\CanalNotification;
use App\Exceptions\PasserelleIndisponible;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Log;

/** Notification du diagramme : reçue par un Compte, envoyée par le ServiceNotification («use»). */
class Notification extends Model
{
    use HasUuids;

    /** Préfixe du sujet push auquel l'application de chaque compte s'abonne. */
    public const PREFIXE_SUJET = 'compte-';

    protected $table = 'notifications';

    protected $fillable = ['canal', 'titre', 'contenu', 'envoyee_le', 'lue_le'];

    protected $casts = [
        'canal' => CanalNotification::class,
        'envoyee_le' => 'datetime',
        'lue_le' => 'datetime',
    ];

    public function compte(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'compte_id')->withoutGlobalScope('heritage');
    }

    /**
     * Opération du diagramme : remet la notification sur son canal, une seule fois.
     * Un prestataire indisponible laisse la notification non envoyée, sans bloquer l'opération qui l'a créée ;
     * elle reste lisible dans l'application.
     */
    public function envoyer(): void
    {
        if ($this->envoyee_le !== null) {
            return;
        }
        $service = app(ServiceNotification::class);
        $compte = $this->compte;
        try {
            match ($this->canal) {
                CanalNotification::PUSH => $service->envoyerPush(self::PREFIXE_SUJET.$compte->id, $this->titre, $this->contenu),
                CanalNotification::SMS => $service->envoyerSms($compte->telephone, $this->titre.' : '.$this->contenu),
                CanalNotification::EMAIL => $service->envoyerEmail($compte->email, $this->titre, $this->contenu),
            };
        } catch (PasserelleIndisponible $e) {
            Log::warning('Notification non remise', ['notification' => $this->id, 'raison' => $e->getMessage()]);

            return;
        }
        $this->update(['envoyee_le' => now()]);
    }

    public function marquerLue(): void
    {
        if ($this->lue_le === null) {
            $this->update(['lue_le' => now()]);
        }
    }
}
