<?php

namespace App\Enums;

/** Énumération StatutDemande du diagramme de classes. */
enum StatutDemande: string
{
    use ValeursEnum;

    case EN_ATTENTE = 'en_attente';
    case ACCEPTEE = 'acceptee';
    case REFUSEE = 'refusee';
    case ANNULEE = 'annulee';
}
