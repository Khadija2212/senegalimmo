<?php

namespace App\Models\Concerns;

use App\Exceptions\OperationRefusee;
use BackedEnum;

/**
 * Garde des transitions d'état : l'opération n'est permise que depuis certains statuts.
 *
 * @property BackedEnum $statut
 */
trait ExigeStatut
{
    protected function exigerStatut(BackedEnum ...$attendus): void
    {
        if (! in_array($this->statut, $attendus, true)) {
            throw new OperationRefusee("Cette opération n'est plus possible : le statut actuel est « ".$this->statut->value.' ».');
        }
    }
}
