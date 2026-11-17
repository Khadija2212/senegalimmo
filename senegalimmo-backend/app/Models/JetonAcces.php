<?php

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken;

/**
 * Jeton d'accès Sanctum. Son propriétaire est rechargé par Compte::tous(),
 * donc dans sa classe concrète, quel que soit le type enregistré dans le jeton.
 */
class JetonAcces extends PersonalAccessToken
{
    protected $table = 'personal_access_tokens';

    public function getTokenableAttribute(): ?Compte
    {
        if (!array_key_exists('tokenable', $this->relations)) {
            $this->setRelation('tokenable', Compte::tous()->find($this->tokenable_id));
        }

        return $this->getRelation('tokenable');
    }
}
