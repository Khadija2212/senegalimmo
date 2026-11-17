<?php

namespace App\Enums;

/** Énumération StatutOffre du diagramme de classes. */
enum StatutOffre: string
{
    use ValeursEnum;

    case EN_ATTENTE = 'en_attente';
    case ACCEPTEE = 'acceptee';
    case REFUSEE = 'refusee';
    case RETIREE = 'retiree';
    case EXPIREE = 'expiree';
}
