<?php

namespace App\Enums;

/** Énumération StatutRetrait du diagramme : demandé, approuvé, versé ou rejeté. */
enum StatutRetrait: string
{
    case DEMANDE = 'demande';
    case APPROUVE = 'approuve';
    case VERSE = 'verse';
    case REJETE = 'rejete';

    /** @return list<string> */
    public static function valeurs(): array
    {
        return array_column(self::cases(), 'value');
    }
}
