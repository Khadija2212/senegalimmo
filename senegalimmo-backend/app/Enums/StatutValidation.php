<?php

namespace App\Enums;

/** Énumération StatutValidation du diagramme : validation d'un agent par l'administrateur. */
enum StatutValidation: string
{
    case EN_ATTENTE = 'en_attente';
    case VALIDE = 'valide';
    case REFUSE = 'refuse';
}
