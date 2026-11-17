<?php

namespace Database\Seeders;

use App\Enums\TypeTransaction;
use App\Models\Administrateur;
use App\Models\OptionPremium;
use Illuminate\Database\Seeder;

/**
 * Premier super administrateur, règles de commission à 0 % (l'administrateur fixe ensuite les taux)
 * et options premium de départ.
 */
class AdminSeeder extends Seeder
{
    private const OPTIONS = [
        ['libelle' => 'Mise en avant 7 jours', 'duree_jours' => 7, 'prix' => 5000],
        ['libelle' => 'Mise en avant 30 jours', 'duree_jours' => 30, 'prix' => 15000],
    ];

    public function run(): void
    {
        $admin = Administrateur::updateOrCreate(['email' => env('ADMIN_EMAIL', 'admin@senegalimmo.com')], [
            'nom' => 'Admin',
            'prenom' => 'SénégalImmo',
            'telephone' => '770000000',
            'password' => env('ADMIN_MOT_DE_PASSE', 'Admin@2026'),
            'niveau' => 'super_admin',
        ]);

        foreach (TypeTransaction::cases() as $type) {
            $admin->reglesCommission()->firstOrCreate(['type_transaction' => $type], ['taux' => 0, 'montant_minimum' => 0, 'actif_depuis' => today()]);
        }
        foreach (self::OPTIONS as $option) {
            OptionPremium::firstOrCreate(['libelle' => $option['libelle']], $option);
        }
    }
}
