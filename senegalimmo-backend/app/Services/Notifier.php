<?php

namespace App\Services;

use App\Models\Alerte;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class Notifier
{
    public static function envoyer(?int $userId, string $titre, string $message, ?string $lien = null): void
    {
        if (!$userId) {
            return;
        }

        try {
            Alerte::create([
                'user_id' => $userId,
                'titre'   => $titre,
                'message' => $message,
                'lien'    => $lien,
            ]);
        } catch (\Throwable $e) {
            // Une alerte ratée ne doit jamais bloquer l'action principale
            Log::warning('Alerte non enregistrée : ' . $e->getMessage());
        }
    }

    public static function admins(string $titre, string $message, ?string $lien = null): void
    {
        User::where('role', 'administrateur')->pluck('id')
            ->each(fn ($id) => self::envoyer($id, $titre, $message, $lien));
    }
}