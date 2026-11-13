<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProfilController extends Controller
{
    // Champs propres à chaque rôle (ceux du diagramme de classes)
    private function champsRole(string $role): array
    {
        return match ($role) {
            'proprietaire'    => ['numero_cni' => 'nullable|string|max:30'],
            'client'          => [
                'profession'     => 'nullable|string|max:100',
                'revenu_mensuel' => 'nullable|numeric|min:0',
                'budget_min'     => 'nullable|numeric|min:0',
                'budget_max'     => 'nullable|numeric|min:0',
            ],
            'locataire'       => ['profession' => 'nullable|string|max:100', 'revenu_mensuel' => 'nullable|numeric|min:0'],
            'acheteur'        => ['budget_min' => 'nullable|numeric|min:0', 'budget_max' => 'nullable|numeric|min:0'],
            'agent', 'agence' => ['nom_agence' => 'nullable|string|max:120', 'numero_licence' => 'nullable|string|max:60'],
            default           => [],
        };
    }

    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json(array_merge($user->toArray(), [
            'a_document' => !empty($user->document_identite),
        ]));
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'nom'       => 'required|string|max:255',
            'prenom'    => 'required|string|max:255',
            'email'     => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'telephone' => 'required|string|max:20',
            'adresse'   => 'nullable|string|max:255',
        ] + $this->champsRole($user->role));

        if ($user->role === 'acheteur'
            && isset($data['budget_min'], $data['budget_max'])
            && (float) $data['budget_max'] < (float) $data['budget_min']) {
            return response()->json(['message' => 'Le budget maximum doit être supérieur au budget minimum.'], 422);
        }

        $user->update($data);

        return response()->json(['message' => 'Profil mis à jour.', 'user' => $user->fresh()]);
    }

    public function motDePasse(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'mot_de_passe_actuel' => 'required|string',
            'password'            => 'required|string|min:6|confirmed',
        ]);

        if (!Hash::check($data['mot_de_passe_actuel'], $user->password)) {
            return response()->json(['message' => 'Le mot de passe actuel est incorrect.'], 422);
        }

        $user->update(['password' => $data['password']]);

        // Les autres appareils connectés sont déconnectés
        $courant = data_get($user->currentAccessToken(), 'id');
        if ($courant) {
            $user->tokens()->where('id', '!=', $courant)->delete();
        }

        return response()->json(['message' => 'Mot de passe modifié.']);
    }

    // Envoi d'une pièce d'identité, conservée hors du dossier public
    public function document(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ], [
            'document.mimes' => 'Le document doit être un PDF, JPG ou PNG.',
            'document.max'   => 'Le document ne doit pas dépasser 5 Mo.',
        ]);

        if ($user->verification === 'verifie') {
            return response()->json(['message' => 'Votre compte est déjà vérifié.'], 422);
        }

        if ($user->document_identite) {
            Storage::disk('local')->delete($user->document_identite);
        }

        $chemin = $request->file('document')->store('documents', 'local');

        $user->update([
            'document_identite'  => $chemin,
            'verification'       => 'en_attente',
            'verification_motif' => null,
            'est_verifie'        => false,
        ]);

        return response()->json(['message' => 'Document envoyé. Un administrateur va le vérifier.']);
    }

    public function documentVoir(Request $request)
    {
        $chemin = $request->user()->document_identite;

        if (!$chemin || !Storage::disk('local')->exists($chemin)) {
            return response()->json(['message' => 'Aucun document.'], 404);
        }

        return Storage::disk('local')->response($chemin);
    }
}