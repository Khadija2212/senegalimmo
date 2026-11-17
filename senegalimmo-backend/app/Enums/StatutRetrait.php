<?php

namespace App\Enums;

/** Énumération StatutRetrait du diagramme : demandé, approuvé, versé ou rejeté. */
enum StatutRetrait: string
{
    use ValeursEnum;

    case DEMANDE = 'demande';
    case APPROUVE = 'approuve';
    case VERSE = 'verse';
    case REJETE = 'rejete';
}
