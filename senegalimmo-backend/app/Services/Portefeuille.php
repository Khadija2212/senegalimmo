<?php

namespace App\Services;

use App\Models\MouvementPortefeuille;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class Portefeuille
{
    public static function crediter(int $userId, float $montant, string $libelle): void
    {
        DB::transaction(function () use ($userId, $montant, $libelle) {
            $user = User::lockForUpdate()->findOrFail($userId);
            $user->solde_portefeuille = (float) $user->solde_portefeuille + $montant;
            $user->save();

            MouvementPortefeuille::create([
                'user_id'     => $user->id,
                'type'        => 'credit',
                'montant'     => $montant,
                'solde_apres' => $user->solde_portefeuille,
                'libelle'     => $libelle,
            ]);
        });
    }

    // Retourne false si le solde est insuffisant
    public static function debiter(int $userId, float $montant, string $libelle): bool
    {
        return DB::transaction(function () use ($userId, $montant, $libelle) {
            $user = User::lockForUpdate()->findOrFail($userId);

            if ((float) $user->solde_portefeuille < $montant) {
                return false;
            }

            $user->solde_portefeuille = (float) $user->solde_portefeuille - $montant;
            $user->save();

            MouvementPortefeuille::create([
                'user_id'     => $user->id,
                'type'        => 'debit',
                'montant'     => $montant,
                'solde_apres' => $user->solde_portefeuille,
                'libelle'     => $libelle,
            ]);

            return true;
        });
    }
}