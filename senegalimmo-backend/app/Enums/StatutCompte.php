<?php

namespace App\Enums;

/** Énumération StatutCompte du diagramme de classes. */
enum StatutCompte: string
{
    use ValeursEnum;

    case ACTIF = 'actif';
    case SUSPENDU = 'suspendu';
    case SUPPRIME = 'supprime';
}
