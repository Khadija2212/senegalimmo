<?php

namespace App\Enums;

/** Énumération StatutSignature du diagramme de classes. */
enum StatutSignature: string
{
    use ValeursEnum;

    case EN_ATTENTE = 'en_attente';
    case SIGNEE = 'signee';
    case REFUSEE = 'refusee';
    case EXPIREE = 'expiree';
}
