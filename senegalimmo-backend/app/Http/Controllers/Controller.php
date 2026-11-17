<?php

namespace App\Http\Controllers;

use App\Exceptions\OperationRefusee;
use App\Models\Agent;
use App\Models\Bien;
use App\Models\Compte;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;

abstract class Controller
{
    private const ACCES_REFUSE = "Vous n'avez pas accès à cette ressource.";

    protected function exigerQue(bool $condition, string $message = self::ACCES_REFUSE): void
    {
        if (! $condition) {
            throw new OperationRefusee($message, OperationRefusee::INTERDIT);
        }
    }

    /** Identifiants des biens du propriétaire, ou des biens assignés à l'agent. */
    protected function biensGeres(Compte $compte): Builder|Relation
    {
        return $compte instanceof Agent ? $compte->requeteBiensAssignes()->select('biens.id') : $compte->biens()->select('id');
    }

    /** Le propriétaire du bien ou l'agent de son mandat actif. */
    protected function exigerGestion(Bien $bien, Compte $compte): void
    {
        $this->exigerQue($bien->estGerePar($compte), "Ce bien n'est pas sous votre gestion.");
    }
}
