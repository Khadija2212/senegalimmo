<?php

namespace App\Http\Controllers;

use App\Models\Bien;
use App\Models\Contrat;
use App\Models\Notation;
use App\Models\PromesseVente;
use App\Models\User;
use Illuminate\Http\Request;

class NotationController extends Controller
{
    // Transactions terminées que l'utilisateur peut noter
    public function aFaire(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'locataire') {
            $items = Contrat::with(['bien:id,titre,quartier,ville', 'proprietaire:id,nom,prenom'])
                ->where('locataire_id', $user->id)
                ->where('statut', 'signe')
                ->get()
                ->map(fn ($c) => [
                    'bien_id'      => $c->bien_id,
                    'bien_titre'   => $c->bien->titre,
                    'lieu'         => $c->bien->quartier . ', ' . $c->bien->ville,
                    'proprietaire' => $c->proprietaire,
                    'type'         => 'location',
                ]);
        } elseif ($user->role === 'acheteur') {
            $items = PromesseVente::with(['bien:id,titre,quartier,ville', 'vendeur:id,nom,prenom'])
                ->where('acheteur_id', $user->id)
                ->where('statut', 'signee')
                ->get()
                ->map(fn ($p) => [
                    'bien_id'      => $p->bien_id,
                    'bien_titre'   => $p->bien->titre,
                    'lieu'         => $p->bien->quartier . ', ' . $p->bien->ville,
                    'proprietaire' => $p->vendeur,
                    'type'         => 'vente',
                ]);
        } else {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $deja = Notation::where('noteur_id', $user->id)->get()->keyBy('bien_id');

        return response()->json(
            $items->map(function ($item) use ($deja) {
                $n = $deja->get($item['bien_id']);

                $item['deja_note'] = (bool) $n;
                $item['note'] = $n?->note;
                $item['commentaire'] = $n?->commentaire;

                return $item;
            })->values()
        );
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['locataire', 'acheteur'], true)) {
            return response()->json(['message' => 'Seuls les locataires et acheteurs peuvent noter.'], 403);
        }

        $data = $request->validate([
            'bien_id'     => 'required|exists:biens,id',
            'note'        => 'required|integer|between:1,5',
            'commentaire' => 'nullable|string|max:500',
        ], [
            'note.between' => 'La note doit être comprise entre 1 et 5.',
        ]);

        $bien = Bien::findOrFail($data['bien_id']);

        // On ne note qu'après une transaction réellement conclue
        $eligible = $user->role === 'locataire'
            ? Contrat::where('bien_id', $bien->id)->where('locataire_id', $user->id)->where('statut', 'signe')->exists()
            : PromesseVente::where('bien_id', $bien->id)->where('acheteur_id', $user->id)->where('statut', 'signee')->exists();

        if (!$eligible) {
            return response()->json(
                ['message' => 'Vous ne pouvez noter qu\'après une transaction terminée.'],
                403
            );
        }

        $dejaNote = Notation::where('noteur_id', $user->id)->where('bien_id', $bien->id)->exists();

        if ($dejaNote) {
            return response()->json(['message' => 'Vous avez déjà noté ce propriétaire pour ce bien.'], 422);
        }

        $notation = Notation::create([
            'noteur_id'   => $user->id,
            'note_id'     => $bien->proprietaire_id,
            'bien_id'     => $bien->id,
            'note'        => $data['note'],
            'commentaire' => isset($data['commentaire']) ? trim($data['commentaire']) : null,
        ]);

        return response()->json($notation, 201);
    }

    // Avis publics sur un propriétaire
    public function avis(int $id)
    {
        $proprietaire = User::where('id', $id)
            ->where('role', 'proprietaire')
            ->first(['id', 'nom', 'prenom']);

        if (!$proprietaire) {
            return response()->json(['message' => 'Propriétaire introuvable.'], 404);
        }

        $notations = Notation::with(['noteur:id,nom,prenom', 'bien:id,titre'])
            ->where('note_id', $id)
            ->latest()
            ->get();

        return response()->json([
            'proprietaire' => $proprietaire,
            'moyenne'      => round((float) $notations->avg('note'), 1),
            'total'        => $notations->count(),
            'avis'         => $notations->map(fn ($n) => [
                'note'        => $n->note,
                'commentaire' => $n->commentaire,
                // Prénom et initiale du nom seulement, pour protéger la vie privée
                'auteur'      => $n->noteur->prenom . ' ' . mb_substr($n->noteur->nom, 0, 1) . '.',
                'bien'        => $n->bien?->titre,
                'date'        => $n->created_at,
            ])->values(),
        ]);
    }
}