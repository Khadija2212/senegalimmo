<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@senegalimmo.com'],
            [
                'nom'         => 'Admin',
                'prenom'      => 'SénégalImmo',
                'telephone'   => '770000000',
                'password'    => 'Admin@2026',
                'role'        => 'administrateur',
                'est_verifie' => true,
            ]
        );
    }
}   