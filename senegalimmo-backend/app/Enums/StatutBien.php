<?php

namespace App\Enums;

/** Énumération StatutBien du diagramme de classes. */
enum StatutBien: string
{
    use ValeursEnum;

    case BROUILLON = 'brouillon';
    case DISPONIBLE = 'disponible';
    case SOUS_OFFRE = 'sous_offre';
    case LOUE = 'loue';
    case VENDU = 'vendu';
    case RETIRE = 'retire';
}
