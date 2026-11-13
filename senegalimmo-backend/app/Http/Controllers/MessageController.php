<?php

namespace App\Http\Controllers;

use App\Models\Bien;
use App\Models\Contrat;
use App\Models\DemandeLocation;
use App\Models\Message;
use App\Models\OffreAchat;
use App\Models\User;
use App\Models\Visite;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    // Vrai s'il existe une ligne liant les deux utilisateurs, dans un sens ou dans l'autre
    private function lies(string $modele, string $colA, string $colB, int $a, int $b): bool
    {
        return $modele::where(fn ($q) => $q->where($colA, $a)->where($colB, $b))
            ->orWhere(fn ($q) => $q->where($colA, $b)->where($colB, $a))
            ->exists();
    }

    private function echange(int $a, int $b): bool
    {
        return $this->lies(Message::class, 'expediteur_id', 'destinataire_id', $a, $b);
    }

    private function peutEcrire(User $moi, User $dest, ?int $bienId): bool
    {
        if ($moi->id === $dest->id) {
            return false;
        }

        // Conversation déjà ouverte
        if ($this->echange($moi->id, $dest->id)) {
            return true;
        }

        // Contacter le propriétaire d'un bien précis
        if ($bienId) {
            $bien = Bien::find($bienId);

            if ($bien && $bien->proprietaire_id === $dest->id && $moi->role !== 'proprietaire') {
                return true;
            }
        }

        // Relation métier existante entre les deux personnes
        return $this->lies(Visite::class, 'demandeur_id', 'proprietaire_id', $moi->id, $dest->id)
            || $this->lies(DemandeLocation::class, 'locataire_id', 'proprietaire_id', $moi->id, $dest->id)
            || $this->lies(OffreAchat::class, 'acheteur_id', 'proprietaire_id', $moi->id, $dest->id)
            || $this->lies(Contrat::class, 'proprietaire_id', 'locataire_id', $moi->id, $dest->id);
    }

    // Liste des conversations de l'utilisateur
    public function conversations(Request $request)
    {
        $id = $request->user()->id;

        $messages = Message::where(fn ($q) => $q->where('expediteur_id', $id)->orWhere('destinataire_id', $id))
            ->latest()
            ->limit(500)
            ->get();

        $groupes = $messages->groupBy(
            fn ($m) => $m->expediteur_id === $id ? $m->destinataire_id : $m->expediteur_id
        );

        $users = User::whereIn('id', $groupes->keys())
            ->get(['id', 'nom', 'prenom', 'role'])
            ->keyBy('id');

        $conversations = $groupes->map(function ($liste, $autreId) use ($users, $id) {
            $interlocuteur = $users->get($autreId);

            if (!$interlocuteur) {
                return null;
            }

            $dernier = $liste->first();

            return [
                'interlocuteur'   => $interlocuteur,
                'dernier_message' => $dernier->contenu,
                'dernier_date'    => $dernier->created_at,
                'dernier_de_moi'  => $dernier->expediteur_id === $id,
                'non_lus'         => $liste->where('destinataire_id', $id)->where('lu', false)->count(),
            ];
        })->filter()->values();

        return response()->json($conversations);
    }

    // Fil de discussion avec un utilisateur
    public function index(Request $request)
    {
        $moi = $request->user();

        $data = $request->validate([
            'avec' => 'required|exists:users,id',
            'bien' => 'nullable|integer',
        ]);

        $dest = User::findOrFail($data['avec']);

        if (!$this->peutEcrire($moi, $dest, isset($data['bien']) ? (int) $data['bien'] : null)) {
            return response()->json(['message' => 'Conversation impossible avec cet utilisateur.'], 403);
        }

        $messages = Message::with('bien:id,titre')
            ->where(function ($q) use ($moi, $dest) {
                $q->where(fn ($s) => $s->where('expediteur_id', $moi->id)->where('destinataire_id', $dest->id))
                    ->orWhere(fn ($s) => $s->where('expediteur_id', $dest->id)->where('destinataire_id', $moi->id));
            })
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        // Les messages reçus sont marqués comme lus
        Message::where('expediteur_id', $dest->id)
            ->where('destinataire_id', $moi->id)
            ->where('lu', false)
            ->update(['lu' => true]);

        return response()->json([
            'interlocuteur' => $dest->only(['id', 'nom', 'prenom', 'role']),
            'messages'      => $messages,
        ]);
    }

    public function store(Request $request)
    {
        $moi = $request->user();

        $data = $request->validate([
            'destinataire_id' => 'required|exists:users,id',
            'contenu'         => 'required|string|max:2000',
            'bien_id'         => 'nullable|exists:biens,id',
        ]);

        $dest = User::findOrFail($data['destinataire_id']);

        if (!$this->peutEcrire($moi, $dest, $data['bien_id'] ?? null)) {
            return response()->json(['message' => 'Vous ne pouvez pas écrire à cet utilisateur.'], 403);
        }

        $contenu = trim($data['contenu']);

        if ($contenu === '') {
            return response()->json(['message' => 'Le message est vide.'], 422);
        }

        $message = Message::create([
            'expediteur_id'   => $moi->id,
            'destinataire_id' => $dest->id,
            'bien_id'         => $data['bien_id'] ?? null,
            'contenu'         => $contenu,
        ]);

        return response()->json($message, 201);
    }
}