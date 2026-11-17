<?php

namespace App\Enums;

/** Énumération StatutVisite du diagramme de classes. */
enum StatutVisite: string
{
    use ValeursEnum;

    case DEMANDEE = 'demandee';
    case CONFIRMEE = 'confirmee';
    case REFUSEE = 'refusee';
    case ANNULEE = 'annulee';
    case EFFECTUEE = 'effectuee';
}
