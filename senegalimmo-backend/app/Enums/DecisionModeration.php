<?php

namespace App\Enums;

/** Énumération DecisionModeration du diagramme de classes. */
enum DecisionModeration: string
{
    use ValeursEnum;

    case APPROUVER = 'approuver';
    case REJETER = 'rejeter';
    case SUSPENDRE = 'suspendre';
}
