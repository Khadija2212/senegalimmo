<?php

namespace App\Http\Controllers;

use App\Models\Bien;
use App\Models\DemandeLocation;
use Illuminate\Http\Request;

class DemandeLocationController extends Controller
{
    // Propriétaire : demandes reçues. Locataire : ses demandes.
    public function index(Request $request)
    {
        $user = $request->user();

        $query = DemandeLocation::with([
            'bien:id,titre,quartier,ville,prix,photos',
            'locataire:id,nom,prenom,telephone',
            'proprietaire:id,nom,prenom,telephone',
            'contrat:id,demande_id,statut',
        ])->latest();

        if ($user->role === 'proprietaire') {
            $query->where('proprietaire_id', $user->id);
        } elseif (in_array($user->role, ['locataire', 'client'])) {
            $query->where('locataire_id', $user->id);
        } else {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['locataire', 'client'])) {
            return response()->json(
                ['message' => 'Seuls les locataires et clients peuvent faire une demande de location.'],
                403
            );
        }

        $data = $request->validate([
            'bien_id'           => 'required|exists:biens,id',
            'message'           => 'nullable|string|max:1000',
            'date_emmenagement' => 'nullable|date|after_or_equal:today',
        ], [
            'date_emmenagement.after_or_equal' => 'La date d\'emménagement ne peut pas être dans le passé.',
        ]);

        $bien = Bien::findOrFail($data['bien_id']);

        if ($bien->transaction !== 'location') {
            return response()->json(['message' => 'Ce bien n\'est pas proposé à la location.'], 422);
        }

        if ($bien->statut !== 'disponible') {
            return response()->json(['message' => 'Ce bien n\'est plus disponible.'], 422);
        }

        $dejaDemande = DemandeLocation::where('bien_id', $bien->id)
            ->where('locataire_id', $user->id)
            ->whereIn('statut', ['en_attente', 'acceptee'])
            ->exists();

        if ($dejaDemande) {
            return response()->json(
                ['message' => 'Vous avez déjà une demande en cours pour ce bien.'],
                422
            );
        }

        $demande = DemandeLocation::create([
            'bien_id'           => $bien->id,
            'locataire_id'      => $user->id,
            'proprietaire_id'   => $bien->proprietaire_id,
            'message'           => $data['message'] ?? null,
            'date_emmenagement' => $data['date_emmenagement'] ?? null,
        ]);

        return response()->json($demande, 201);
    }

    // Changement de statut : accepter / refuser (propriétaire), annuler (locataire)
    public function update(Request $request, DemandeLocation $demande)
    {
        $user = $request->user();

        $data = $request->validate([
            'statut'      => 'required|in:acceptee,refusee,annulee',
            'motif_refus' => 'required_if:statut,refusee|nullable|string|max:500',
        ], [
            'motif_refus.required_if' => 'Indiquez le motif du refus.',
        ]);

        $estProprietaire = $demande->proprietaire_id === $user->id;
        $estLocataire = $demande->locataire_id === $user->id;

        if (!$estProprietaire && !$estLocataire) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if ($data['statut'] === 'annulee') {
            if (!$estLocataire) {
                return response()->json(['message' => 'Seul le locataire peut annuler sa demande.'], 403);
            }
            if (!in_array($demande->statut, ['en_attente', 'acceptee'])) {
                return response()->json(['message' => 'Cette demande ne peut plus être annulée.'], 422);
            }
            if ($demande->contrat()->exists()) {
                return response()->json(['message' => 'Un bail existe déjà pour cette demande.'], 422);
            }
        } else {
            if (!$estProprietaire) {
                return response()->json(['message' => 'Action réservée au propriétaire.'], 403);
            }
            if ($demande->statut !== 'en_attente') {
                return response()->json(['message' => 'Cette demande a déjà été traitée.'], 422);
            }
        }

        $demande->update([
            'statut'      => $data['statut'],
            'motif_refus' => $data['statut'] === 'refusee' ? $data['motif_refus'] : null,
        ]);

        return response()->json($demande);
    }
}