<?php

namespace Database\Factories;

use App\Enums\StatutAnnonce;
use App\Enums\TypeTransaction;
use App\Models\Annonce;
use App\Models\Bien;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Annonce> */
class AnnonceFactory extends Factory
{
    protected $model = Annonce::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'bien_id' => Bien::factory(),
            'reference' => Annonce::nouvelleReference(),
            'type_transaction' => TypeTransaction::LOCATION,
            'prix' => 300000,
            'charges' => 20000,
            'caution' => 600000,
            'statut' => StatutAnnonce::EN_MODERATION,
        ];
    }

    public function publiee(): static
    {
        return $this->state(['statut' => StatutAnnonce::PUBLIEE, 'publiee_le' => now()]);
    }

    public function vente(int $prix = 85000000): static
    {
        return $this->state(['type_transaction' => TypeTransaction::VENTE, 'prix' => $prix, 'charges' => 0, 'caution' => 0]);
    }
}
