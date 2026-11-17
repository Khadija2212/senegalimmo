<?php

namespace App\Enums;

/** Énumération TypeMedia du diagramme de classes. */
enum TypeMedia: string
{
    use ValeursEnum;

    case PHOTO = 'photo';
    case VIDEO = 'video';
    case PLAN = 'plan';
    case DOCUMENT = 'document';
}
