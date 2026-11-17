<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\Compte;
use App\Models\Utilisateur;
use Illuminate\Validation\Rule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // Inscription
    public function register(Request $request)
    {
        $request->validate([
            'nom'       => 'required|string|max:255',
            'prenom'    => 'required|string|max:255',
            'email'     => 'required|string|email|unique:users',
            'telephone' => 'required|string|max:20',
            'password'  => 'required|string|min:6|confirmed',
            'role'      => ['required', Rule::in(Role::inscriptibles())],
        ]);

        // La classe concrète (Client, Proprietaire, Agent) fixe elle-même le rôle.
        $classe = Compte::classePour($request->role);
        $user = $classe::create([
            'nom'       => $request->nom,
            'prenom'    => $request->prenom,
            'email'     => $request->email,
            'telephone' => $request->telephone,
            'password'  => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Inscription réussie',
            'user'    => $user,
            'token'   => $token,
        ], 201);
    }

    // Connexion
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Email ou mot de passe incorrect.'],
            ]);
        }

        $user  = Compte::tous()->where('email', $request->email)->firstOrFail();

        if ($user->estSuspendu()) {
            return response()->json([
                'message' => 'Votre compte a été suspendu. Contactez l\'administrateur.',
            ], 403);
        }

        if ($user instanceof Utilisateur) {
            $user->update(['derniere_connexion' => now()]);
        }
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie',
            'user'    => $user,
            'token'   => $token,
        ]);
    }

    // Déconnexion
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie',
        ]);
    }

    // Profil connecté
    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    // Devise d'affichage choisie par l'utilisateur (mode diaspora)
    public function devise(Request $request)
    {
        $data = $request->validate([
            'devise' => 'required|in:FCFA,EUR,USD',
        ]);

        $request->user()->update([
            'devise'        => $data['devise'],
            'mode_diaspora' => $data['devise'] !== 'FCFA',
        ]);

        return response()->json($request->user()->only(['id', 'devise', 'mode_diaspora']));
    }

    // Modifier le profil
    public function modifierProfil(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'nom'            => 'required|string|max:255',
            'prenom'         => 'required|string|max:255',
            'telephone'      => 'required|string|max:25',
            'adresse'        => 'nullable|string|max:255',
            'budget_min'     => 'nullable|numeric|min:0',
            'budget_max'     => 'nullable|numeric|min:0',
            'profession'     => 'nullable|string|max:255',
            'revenu_mensuel' => 'nullable|numeric|min:0',
            'numero_cni'     => 'nullable|string|max:50',
            'nom_agence'     => 'nullable|string|max:255',
            'numero_licence' => 'nullable|string|max:50',
            'matricule'      => 'nullable|string|max:50',
        ]);

        $user->update($data);

        return response()->json([
            'message' => 'Profil mis à jour avec succès.',
            'user'    => $user,
        ]);
    }

    // Changer le mot de passe
    public function changerMotDePasse(Request $request)
    {
        $request->validate([
            'ancien_mot_de_passe' => 'required',
            'nouveau_mot_de_passe' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->ancien_mot_de_passe, $user->password)) {
            throw ValidationException::withMessages([
                'ancien_mot_de_passe' => ['Le mot de passe actuel est incorrect.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->nouveau_mot_de_passe),
        ]);

        return response()->json([
            'message' => 'Mot de passe modifié avec succès.',
        ]);
    }

    // Téléverser un document d'identité pour vérification
    public function televerserDocument(Request $request)
    {
        $request->validate([
            'document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120', // max 5MB
        ]);

        $user = $request->user();

        if ($request->hasFile('document')) {
            $path = $request->file('document')->store('documents', 'public');
            $user->update([
                'document_identite' => $path,
            ]);

            return response()->json([
                'message'           => 'Document téléversé avec succès. L\'administrateur va vérifier votre identité.',
                'document_identite' => $path,
            ]);
        }

        return response()->json(['message' => 'Aucun fichier reçu.'], 400);
    }
}
