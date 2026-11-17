<?php

namespace App\Enums;

/** Énumération TypeEcriture du diagramme de classes. */
enum TypeEcriture: string
{
    use ValeursEnum;

    case CREDIT_LOYER = 'credit_loyer';
    case CREDIT_VENTE = 'credit_vente';
    case COMMISSION_AGENT = 'commission_agent';
    case BLOCAGE_RETRAIT = 'blocage_retrait';
    case DEBIT_RETRAIT = 'debit_retrait';
    case DEBLOCAGE = 'deblocage';

    public function libelle(): string
    {
        return match ($this) {
            self::CREDIT_LOYER => 'Loyer reçu',
            self::CREDIT_VENTE => 'Vente reçue',
            self::COMMISSION_AGENT => 'Commission',
            self::BLOCAGE_RETRAIT => 'Retrait demandé',
            self::DEBIT_RETRAIT => 'Retrait versé',
            self::DEBLOCAGE => 'Retrait annulé',
        };
    }
}
