<?php

namespace App\Enums;

/** Énumération Role du diagramme de classes : une valeur par classe concrète de Compte. */
enum Role: string
{
    case CLIENT = 'client';
    case PROPRIETAIRE = 'proprietaire';
    case AGENT = 'agent';
    case ADMINISTRATEUR = 'administrateur';

    /** Rôles qu'on peut choisir à l'inscription (l'administrateur est créé à part). */
    public static function inscriptibles(): array
    {
        return [self::CLIENT->value, self::PROPRIETAIRE->value, self::AGENT->value];
    }
}
