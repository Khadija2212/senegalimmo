<?php

namespace App\Enums;

/**
 * Énumération MethodePaiement du diagramme de classes.
 * Les libellés PayTech sont ceux du paramètre target_payment de l'API.
 */
enum MethodePaiement: string
{
    case WAVE = 'wave';
    case ORANGE_MONEY = 'orange_money';
    case FREE_MONEY = 'free_money';
    case CARTE_BANCAIRE = 'carte_bancaire';

    public function libelle(): string
    {
        return match ($this) {
            self::WAVE => 'Wave',
            self::ORANGE_MONEY => 'Orange Money',
            self::FREE_MONEY => 'Free Money',
            self::CARTE_BANCAIRE => 'Carte bancaire',
        };
    }

    public function nomPaytech(): string
    {
        return match ($this) {
            self::WAVE => 'Wave',
            self::ORANGE_MONEY => 'Orange Money',
            self::FREE_MONEY => 'Free Money',
            self::CARTE_BANCAIRE => 'Carte Bancaire',
        };
    }

    /** Service PayTech utilisé pour un versement, null quand la méthode ne reçoit pas d'argent. */
    public function serviceTransfert(): ?string
    {
        return match ($this) {
            self::WAVE => 'Wave Senegal',
            self::ORANGE_MONEY => 'Orange Money Senegal',
            self::FREE_MONEY => 'Free Money Senegal',
            self::CARTE_BANCAIRE => null,
        };
    }

    /** @return list<string> */
    public static function valeurs(): array
    {
        return array_column(self::cases(), 'value');
    }
}
