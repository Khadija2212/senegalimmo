<?php

namespace Database\Seeders;

use App\Models\Categorie;
use Illuminate\Database\Seeder;

class CategorieSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['nom' => 'Appartement', 'slug' => 'appartement', 'description' => 'Appartements, studios et lofts', 'icone' => 'apartment'],
            ['nom' => 'Villa & Maison', 'slug' => 'villa', 'description' => 'Villas individuelles, duplex et résidences', 'icone' => 'house'],
            ['nom' => 'Terrain & Parcelle', 'slug' => 'terrain', 'description' => 'Terrains nus, parcelles agricoles et industrielles', 'icone' => 'terrain'],
            ['nom' => 'Immeuble', 'slug' => 'immeuble', 'description' => 'Immeubles complets R+1 à R+10', 'icone' => 'business'],
            ['nom' => 'Bureau & Commerce', 'slug' => 'bureau', 'description' => 'Bureaux, boutiques et locaux professionnels', 'icone' => 'storefront'],
            ['nom' => 'Chambre & Studio', 'slug' => 'studio', 'description' => 'Chambres d\'hôtes, colocations et studios meublés', 'icone' => 'single_bed'],
        ];

        foreach ($categories as $cat) {
            Categorie::updateOrCreate(['slug' => $cat['slug']], $cat);
        }
    }
}
