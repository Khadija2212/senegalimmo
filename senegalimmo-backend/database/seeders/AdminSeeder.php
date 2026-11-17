<?php

namespace Database\Seeders;

use App\Models\Administrateur;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        Administrateur::updateOrCreate(
            ['email' => 'admin@senegalimmo.com'],
            [
                'nom'         => 'Admin',
                'prenom'      => 'SénégalImmo',
                'telephone'   => '770000000',
                'password'    => 'Admin@2026',
                'niveau'      => 'super_admin',
                'est_verifie' => true,
            ]
        );
    }
}   