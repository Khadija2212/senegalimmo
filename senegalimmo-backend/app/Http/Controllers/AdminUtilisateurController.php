<?php

namespace App\Http\Controllers;

use App\Models\Administrateur;
use App\Models\Compte;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminUtilisateurController extends Controller
{
    private function refus()
    {
        return response()->json(['message' => 'Accès réservé à l\'administrateur.'], 403);
    }

    public function index(Request $request)
    {
        if ($request->user()->role !== 'administrateur') {
            return $this->refus();
        }

        $query = Compte::tous()->where('role', '!=', Administrateur::ROLE);

        if ($request->filled('role')) {
            $request->role === 'agent'
                ? $query->where('role', 'agent')
                : $query->where('role', $request->role);
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('verification')) {
            $query->where('verification', $request->verification);
        }

        if ($request->filled('q')) {
            $q = '%' . $request->q . '%';
            $query->where(fn ($s) => $s->where('nom', 'ilike', $q)
                ->orWhere('prenom', 'ilike', $q)
                ->orWhere('email', 'ilike', $q));
        }

        // Les vérifications en attente d'abord
        $users = $query
            ->orderByRaw("case when verification = 'en_attente' then 0 else 1 end")
            ->orderByDesc('created_at')
            ->limit(300)
            ->get()
            ->map(function ($u) {
                $u->setAttribute('a_document', !empty($u->document_identite));

                return $u->makeHidden(['password', 'remember_token', 'document_identite']);
            });

        return response()->json($users);
    }

    // Suspendre ou réactiver un compte
    public function statut(Request $request, Compte $user)
    {
        if ($request->user()->role !== 'administrateur') {
            return $this->refus();
        }

        if ($user->role === 'administrateur') {
            return response()->json(['message' => 'Un administrateur ne peut pas être suspendu ici.'], 422);
        }

        $data = $request->validate(['statut' => 'required|in:actif,suspendu']);

        $user->update(['statut' => $data['statut']]);

        // Un compte suspendu perd ses connexions en cours
        if ($data['statut'] === 'suspendu') {
            $user->tokens()->delete();
        }

        return response()->json($user->only(['id', 'statut']));
    }

    // Valider ou refuser la vérification d'identité
    public function verification(Request $request, Compte $user)
    {
        if ($request->user()->role !== 'administrateur') {
            return $this->refus();
        }

        $data = $request->validate([
            'decision' => 'required|in:verifie,refuse',
            'motif'    => 'required_if:decision,refuse|nullable|string|max:500',
        ], ['motif.required_if' => 'Indiquez le motif du refus.']);

        $user->update([
            'verification'       => $data['decision'],
            'est_verifie'        => $data['decision'] === 'verifie',
            'verification_motif' => $data['decision'] === 'refuse' ? $data['motif'] : null,
        ]);

        return response()->json($user->only(['id', 'verification', 'est_verifie']));
    }

    public function document(Request $request, Compte $user)
    {
        if ($request->user()->role !== 'administrateur') {
            return $this->refus();
        }

        if (!$user->document_identite || !Storage::disk('local')->exists($user->document_identite)) {
            return response()->json(['message' => 'Aucun document.'], 404);
        }

        return Storage::disk('local')->response($user->document_identite);
    }
}