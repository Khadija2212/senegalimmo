<?php

namespace App\Enums;

/** Énumération StatutCompte du diagramme de classes. */
enum StatutCompte: string
{
    case ACTIF = 'actif';
    case SUSPENDU = 'suspendu';
    case SUPPRIME = 'supprime';
}
