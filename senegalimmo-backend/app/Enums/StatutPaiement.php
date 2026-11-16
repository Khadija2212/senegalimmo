<?php

namespace App\Enums;

/** Énumération StatutPaiement du diagramme de classes. */
enum StatutPaiement: string
{
    case EN_ATTENTE = 'en_attente';
    case REUSSI = 'reussi';
    case ECHOUE = 'echoue';
    case REMBOURSE = 'rembourse';

    /** @return list<string> */
    public static function valeurs(): array
    {
        return array_column(self::cases(), 'value');
    }
}
