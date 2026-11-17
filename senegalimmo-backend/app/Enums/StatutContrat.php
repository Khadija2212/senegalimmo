<?php

namespace App\Enums;

/** Énumération StatutContrat du diagramme de classes. */
enum StatutContrat: string
{
    use ValeursEnum;

    case BROUILLON = 'brouillon';
    case EN_SIGNATURE = 'en_signature';
    case SIGNE = 'signe';
    case RESILIE = 'resilie';
    case EXPIRE = 'expire';
}
