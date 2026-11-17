<?php

namespace App\Enums;

/** Énumération TypeBien du diagramme de classes. */
enum TypeBien: string
{
    use ValeursEnum;

    case APPARTEMENT = 'appartement';
    case MAISON = 'maison';
    case VILLA = 'villa';
    case STUDIO = 'studio';
    case CHAMBRE = 'chambre';
    case TERRAIN = 'terrain';
    case BUREAU = 'bureau';
    case LOCAL_COMMERCIAL = 'local_commercial';
}
