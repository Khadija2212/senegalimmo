<?php

namespace App\Http\Controllers;

use App\Models\Annonce;
use App\Models\Bien;
use Illuminate\Http\Request;
use App\Models\Mandat;
use App\Models\User;

class AnnonceController extends Controller
{
    private function refuser(string $message = 'Accès refusé.')
    {
        return response()->json(['message' => $message], 403);
    }

    // Admin : toutes les annonces. Propriétaire : les siennes.
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Annonce::with(['bien', 'auteur:id,nom,prenom,telephone'])->latest();

        if ($user->role === 'administrateur') {
            if ($request->filled('statut')) {
                $query->where('statut', $request->statut);
            }
        } elseif ($user->role === 'proprietaire') {
            $query->where('auteur_id', $user->id);
        } else {
            return $this->refuser();
        }

        return response()->json($query->get());
    }

       // Le propriétaire, ou l'agence / l'agent sous mandat, soumet un bien pour publication
    public function store(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['proprietaire', 'agence', 'agent'], true)) {
            return $this->refuser('Action non autorisée.');
        }

        $data = $request->validate([
            'bien_id' => 'required|exists:biens,id',
        ]);

        $bien = Bien::findOrFail($data['bien_id']);

        if ($message = $this->refusPublication($user, $bien)) {
            return $this->refuser($message);
        }

        if ($bien->statut !== 'disponible') {
            return response()->json(['message' => 'Ce bien n\'est plus disponible.'], 422);
        }

        $dejaActive = Annonce::where('bien_id', $bien->id)
            ->whereIn('statut', ['en_attente', 'publiee'])
            ->exists();

        if ($dejaActive) {
            return response()->json(
                ['message' => 'Ce bien a déjà une annonce en attente ou publiée.'],
                422
            );
        }

        $annonce = Annonce::create([
            'bien_id'          => $bien->id,
            'auteur_id'        => $user->id,
            'titre'            => $bien->titre,
            'description'      => $bien->description,
            'prix'             => $bien->prix,
            'photos'           => $bien->photos ?? [],
            'type_transaction' => $bien->transaction,
            'statut'           => 'en_attente',
            'bien_verifie'     => false,
        ]);

        return response()->json($annonce, 201);
    }

    // Retourne un message de refus, ou null si la publication est autorisée
    private function refusPublication(User $user, Bien $bien): ?string
    {
        $mandat = Mandat::where('bien_id', $bien->id)
            ->where('statut', 'actif')
            ->whereDate('date_fin', '>=', today())
            ->first();

        if ($user->role === 'proprietaire') {
            if ($bien->proprietaire_id !== $user->id) {
                return 'Ce bien ne vous appartient pas.';
            }

            if ($mandat && $mandat->type === 'exclusif') {
                return 'Ce bien est sous mandat exclusif : seul l\'agent immobilier peut le publier.';
            }

            return null;
        }

        if (!$mandat) {
            return 'Ce bien n\'est pas sous mandat actif.';
        }

        if (in_array($user->role, ['agent', 'agence'], true)) {
            return ($mandat->agent_id === $user->id || $mandat->agence_id === $user->id)
                ? null
                : 'Ce bien ne vous est pas confié par mandat.';
        }

        return 'Action non autorisée.';
    }

    public function show(Request $request, Annonce $annonce)
    {
        $user = $request->user();

        if ($user->role !== 'administrateur' && $annonce->auteur_id !== $user->id) {
            return $this->refuser();
        }

        return response()->json($annonce->load(['bien', 'auteur:id,nom,prenom,telephone']));
    }

    // Modération par l'administrateur : publier ou rejeter
    public function update(Request $request, Annonce $annonce)
    {
        if ($request->user()->role !== 'administrateur') {
            return $this->refuser('Action réservée à l\'administrateur.');
        }

        $data = $request->validate([
            'statut'      => 'required|in:publiee,rejetee',
            'motif_rejet' => 'required_if:statut,rejetee|nullable|string|max:500',
            'verifie'     => 'nullable|boolean',
        ], [
            'motif_rejet.required_if' => 'Indiquez le motif du rejet.',
        ]);

        if (!in_array($annonce->statut, ['en_attente', 'publiee'])) {
            return response()->json(['message' => 'Cette annonce a déjà été traitée.'], 422);
        }

        if ($data['statut'] === 'publiee') {
            $verifie = (bool) ($data['verifie'] ?? false);

            $annonce->update([
                'statut'       => 'publiee',
                'motif_rejet'  => null,
                'bien_verifie' => $verifie,
            ]);
            $annonce->bien()->update(['est_verifie' => $verifie]);
        } else {
            $annonce->update([
                'statut'      => 'rejetee',
                'motif_rejet' => $data['motif_rejet'],
            ]);
        }

        return response()->json($annonce->load('bien'));
    }

    // Attribuer ou retirer le badge « Bien vérifié »
    public function verification(Request $request, Annonce $annonce)
    {
        if ($request->user()->role !== 'administrateur') {
            return $this->refuser('Action réservée à l\'administrateur.');
        }

        $data = $request->validate(['verifie' => 'required|boolean']);

        $annonce->update(['bien_verifie' => $data['verifie']]);
        $annonce->bien()->update(['est_verifie' => $data['verifie']]);

        return response()->json($annonce->load('bien'));
    }

        // L'auteur, ou le propriétaire du bien, retire l'annonce
    public function destroy(Request $request, Annonce $annonce)
    {
        $user = $request->user();
        $annonce->loadMissing('bien');

        $estAuteur = $annonce->auteur_id === $user->id;
        $estProprietaire = $annonce->bien && $annonce->bien->proprietaire_id === $user->id;

        if (!$estAuteur && !$estProprietaire) {
            return $this->refuser();
        }

        $annonce->delete();

        return response()->json(['message' => 'Annonce retirée.']);
    }
}