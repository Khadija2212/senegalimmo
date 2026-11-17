<?php

namespace App\Enums;

/** Énumération TypeTransaction du diagramme de classes. */
enum TypeTransaction: string
{
    use ValeursEnum;

    case LOCATION = 'location';
    case VENTE = 'vente';
}
