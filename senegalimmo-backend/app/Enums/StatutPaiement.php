<?php

namespace App\Enums;

/** Énumération StatutPaiement du diagramme de classes. */
enum StatutPaiement: string
{
    use ValeursEnum;

    case EN_ATTENTE = 'en_attente';
    case REUSSI = 'reussi';
    case ECHOUE = 'echoue';
    case REMBOURSE = 'rembourse';
}
