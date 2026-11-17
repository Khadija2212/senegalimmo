<?php

namespace Database\Factories;

use App\Enums\StatutValidation;
use App\Models\Agent;

/** @extends CompteFactory<Agent> */
class AgentFactory extends CompteFactory
{
    protected $model = Agent::class;

    public function valide(): static
    {
        return $this->state(['statut_validation' => StatutValidation::VALIDE, 'valide_le' => now(), 'agence' => 'Teranga Immobilier']);
    }
}
