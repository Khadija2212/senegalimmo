<?php

namespace App\Enums;

/** Énumération StatutAnnonce du diagramme de classes. */
enum StatutAnnonce: string
{
    use ValeursEnum;

    case EN_MODERATION = 'en_moderation';
    case PUBLIEE = 'publiee';
    case SUSPENDUE = 'suspendue';
    case REJETEE = 'rejetee';
    case LOUEE = 'louee';
    case VENDUE = 'vendue';
    case EXPIREE = 'expiree';

    public function libelle(): string
    {
        return match ($this) {
            self::EN_MODERATION => 'en modération',
            self::PUBLIEE => 'publiée',
            self::SUSPENDUE => 'suspendue',
            self::REJETEE => 'rejetée',
            self::LOUEE => 'louée',
            self::VENDUE => 'vendue',
            self::EXPIREE => 'expirée',
        };
    }

    /** Statuts d'une annonce qui occupe encore son bien. @return list<self> */
    public static function enCours(): array
    {
        return [self::EN_MODERATION, self::PUBLIEE, self::SUSPENDUE];
    }
}
