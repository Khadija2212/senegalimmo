<?php

namespace App\Enums;

/** Énumération NiveauInteret du diagramme de classes. */
enum NiveauInteret: string
{
    use ValeursEnum;

    case FAIBLE = 'faible';
    case MOYEN = 'moyen';
    case FORT = 'fort';
}
