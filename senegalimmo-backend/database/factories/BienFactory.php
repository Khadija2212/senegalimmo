<?php

namespace Database\Factories;

use App\Enums\StatutBien;
use App\Enums\TypeBien;
use App\Models\Bien;
use App\Models\Proprietaire;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Bien> */
class BienFactory extends Factory
{
    protected $model = Bien::class;

    private const QUARTIERS = ['Almadies', 'Mermoz', 'Point E', 'Sacré-Cœur', 'Ngor', 'Ouakam', 'Liberté 6', 'Fann'];

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $chambres = fake()->numberBetween(1, 5);

        return [
            'proprietaire_id' => Proprietaire::factory(),
            'titre' => 'Appartement '.$chambres.' chambres',
            'description' => 'Logement lumineux, proche des commerces et des transports.',
            'type' => TypeBien::APPARTEMENT,
            'surface' => fake()->numberBetween(40, 250),
            'nombre_pieces' => $chambres + 1,
            'nombre_chambres' => $chambres,
            'meuble' => false,
            'adresse' => 'Rue '.fake()->numberBetween(1, 120),
            'quartier' => fake()->randomElement(self::QUARTIERS),
            'ville' => 'Dakar',
            'latitude' => 14.7 + fake()->randomFloat(4, 0, 0.08),
            'longitude' => -17.5 + fake()->randomFloat(4, 0, 0.08),
            'statut' => StatutBien::BROUILLON,
        ];
    }
}
