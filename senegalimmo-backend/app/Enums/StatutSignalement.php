<?php

namespace App\Enums;

/** Énumération StatutSignalement du diagramme de classes. */
enum StatutSignalement: string
{
    use ValeursEnum;

    case OUVERT = 'ouvert';
    case EN_COURS = 'en_cours';
    case RESOLU = 'resolu';
    case REJETE = 'rejete';
}
