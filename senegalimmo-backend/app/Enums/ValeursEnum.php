<?php

namespace App\Enums;

/** Valeurs brutes d'une énumération, pour la validation et les contraintes CHECK. */
trait ValeursEnum
{
    /** @return list<string> */
    public static function valeurs(): array
    {
        return array_column(self::cases(), 'value');
    }
}
