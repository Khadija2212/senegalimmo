<?php

namespace App\Enums;

/** Énumération TypeEtatDesLieux du diagramme de classes. */
enum TypeEtatDesLieux: string
{
    use ValeursEnum;

    case ENTREE = 'entree';
    case SORTIE = 'sortie';
}
