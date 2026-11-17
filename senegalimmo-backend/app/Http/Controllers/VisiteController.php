<?php

namespace App\Http\Controllers;

use App\Models\Compte;
use App\Models\Bien;
use App\Models\Mandat;
use App\Models\Visite;
use Illuminate\Http\Request;

class VisiteController extends Controller
{
    // Transitions autorisées : statut actuel => statuts possibles
    private const TRANSITIONS = [
        'en_attente' => ['confirme', 'annule'],
        'confirme'   => ['effectue', 'annule'],
        'effectue'   => ['effectue'],
    ];

    // Biens confiés à l'agence, ou assignés à l'agent, sous mandat actif
    private function biensGeres(Compte $user): array
    {
        $query = Mandat::where('statut', 'actif')->whereDate('date_fin', '>=', today());

        if ($user->role === 'agent') {
            $query->where(fn ($q) => $q->where('agent_id', $user->id)->orWhere('agence_id', $user->id));
        } else {
            return [];
        }

        return $query->pluck('bien_id')->all();
    }

    // Propriétaire : visites reçues. Agence / agent : visites de leurs biens. Autres : leurs demandes.
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Visite::with([
            'bien:id,titre,quartier,ville,photos',
            'demandeur:id,nom,prenom,telephone',
            'proprietaire:id,nom,prenom',
            'agent:id,nom,prenom,telephone',
        ])->orderByDesc('created_at');

        if ($user->role === 'proprietaire') {
            $query->where('proprietaire_id', $user->id);
        } elseif ($user->role === 'agent') {
            $query->where(fn ($q) => $q->where('agent_id', $user->id)->orWhereIn('bien_id', $this->biensGeres($user)));
        } else {
            $query->where('demandeur_id', $user->id);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if (!$user->role === 'client') {
            return response()->json(
                ['message' => 'Seuls les clients, locataires et acheteurs peuvent demander une visite.'],
                403
            );
        }

        $data = $request->validate([
            'bien_id'     => 'required|exists:biens,id',
            'date_visite' => 'required|date|after:now',
            'commentaire' => 'nullable|string|max:500',
        ], [
            'date_visite.after' => 'La date de visite doit être dans le futur.',
        ]);

        $bien = Bien::findOrFail($data['bien_id']);

        if ($bien->statut !== 'disponible') {
            return response()->json(['message' => 'Ce bien n\'est plus disponible.'], 422);
        }

        $dejaDemandee = Visite::where('bien_id', $bien->id)
            ->where('demandeur_id', $user->id)
            ->where('statut', 'en_attente')
            ->exists();

        if ($dejaDemandee) {
            return response()->json(
                ['message' => 'Vous avez déjà une demande de visite en attente pour ce bien.'],
                422
            );
        }

        // Trouver si un agent est assigné au bien via un mandat actif
        $mandat = Mandat::where('bien_id', $bien->id)
            ->where('statut', 'actif')
            ->whereDate('date_fin', '>=', today())
            ->first();

        $visite = Visite::create([
            'bien_id'         => $bien->id,
            'demandeur_id'    => $user->id,
            'proprietaire_id' => $bien->proprietaire_id,
            'agent_id'        => $mandat?->agent_id ?: $mandat?->agence_id,
            'date_visite'     => $data['date_visite'],
            'commentaire'     => $data['commentaire'] ?? null,
        ]);

        return response()->json($visite, 201);
    }

    public function show(Request $request, Visite $visite)
    {
        $user = $request->user();

        $autorise = $visite->demandeur_id === $user->id
            || $visite->proprietaire_id === $user->id
            || $visite->agent_id === $user->id
            || in_array($visite->bien_id, $this->biensGeres($user));

        if (!$autorise) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return response()->json($visite->load(['bien', 'demandeur:id,nom,prenom,telephone', 'agent:id,nom,prenom']));
    }

    // Changement de statut et rédaction de compte-rendu
    public function update(Request $request, Visite $visite)
    {
        $user = $request->user();

        $data = $request->validate([
            'statut'       => 'nullable|in:confirme,annule,effectue',
            'compte_rendu' => 'nullable|string|max:2000',
            'agent_id'     => 'nullable|exists:users,id',
        ]);

        $estGestionnaire = $visite->proprietaire_id === $user->id
            || $visite->agent_id === $user->id
            || in_array($visite->bien_id, $this->biensGeres($user));
        $estDemandeur = $visite->demandeur_id === $user->id;

        if (!$estGestionnaire && !$estDemandeur) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if (!$estGestionnaire && isset($data['statut']) && $data['statut'] !== 'annule') {
            return response()->json(['message' => 'Action non autorisée.'], 403);
        }

        if (isset($data['statut'])) {
            $autorises = self::TRANSITIONS[$visite->statut] ?? [];
            if (!in_array($data['statut'], $autorises)) {
                return response()->json(['message' => 'Cette visite ne peut plus être modifiée.'], 422);
            }
            $visite->statut = $data['statut'];
        }

        if (isset($data['compte_rendu']) && $estGestionnaire) {
            $visite->compte_rendu = $data['compte_rendu'];
        }

        if (isset($data['agent_id']) && $user->role === 'agent') {
            $visite->agent_id = $data['agent_id'];
        }

        $visite->save();

        return response()->json($visite);
    }

    public function destroy()
    {
        return response()->json(['message' => 'Suppression non autorisée.'], 405);
    }
}
