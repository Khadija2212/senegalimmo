<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CanalNotification;
use App\Enums\Role;
use App\Enums\StatutCompte;
use App\Http\Controllers\Controller;
use App\Models\Compte;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Cas « Envoyer des notifications », qui inclut « Envoyer SMS » sur le canal SMS. */
class NotificationAdminController extends Controller
{
    public function envoyer(Request $request): JsonResponse
    {
        $d = $request->validate([
            'compte_id' => ['required_without:role', 'nullable', 'uuid'],
            'role' => ['required_without:compte_id', 'nullable', Rule::enum(Role::class)],
            'canal' => ['required', Rule::enum(CanalNotification::class)],
            'titre' => ['required', 'string', 'max:150'],
            'contenu' => ['required', 'string', 'max:1000'],
        ]);
        $destinataires = isset($d['compte_id'])
            ? collect([Compte::tous()->findOrFail($d['compte_id'])])
            : Compte::tous()->where('role', $d['role'])->where('statut', StatutCompte::ACTIF)->get();

        foreach ($destinataires as $compte) {
            $request->user()->envoyerNotification($compte, new Notification(['canal' => $d['canal'], 'titre' => $d['titre'], 'contenu' => $d['contenu']]));
        }

        return response()->json(['envoyees' => $destinataires->count()]);
    }
}
