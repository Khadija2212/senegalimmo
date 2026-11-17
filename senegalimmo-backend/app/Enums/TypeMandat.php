<?php

namespace App\Enums;

/** Énumération TypeMandat du diagramme de classes. */
enum TypeMandat: string
{
    use ValeursEnum;

    case SIMPLE = 'simple';
    case EXCLUSIF = 'exclusif';
}
