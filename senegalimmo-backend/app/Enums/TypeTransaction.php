<?php

namespace App\Enums;

/** Énumération TypeTransaction du diagramme de classes. */
enum TypeTransaction: string
{
    case LOCATION = 'location';
    case VENTE = 'vente';
}
