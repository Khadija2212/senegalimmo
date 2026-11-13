<?php

namespace App\Http\Controllers;

use App\Models\Bien;
use App\Models\Mandat;
use App\Models\User;
use Illuminate\Http\Request;

class MandatController extends Controller
{
    private function refus(string $message, int $code = 422)
    {
        return response()->json(['message' => $message], $code);
    }

    // Les mandats dont la date de fin est passée deviennent « expirés »
    private function expirer(): void
    {
        Mandat::where('statut', 'actif')->whereDate('date_fin', '<', today())->update(['statut' => 'expire']);
    }

    // Liste des agents immobiliers (ou agences historiques), pour que le propriétaire choisisse
    public function agences(Request $request)
    {
        if ($request->user()->role !== 'proprietaire') {
            return $this->refus('Accès refusé.', 403);
        }

        return response()->json(
            User::whereIn('role', ['agent', 'agence'])->where('statut', 'actif')->orderBy('prenom')
                ->get(['id', 'nom', 'prenom', 'telephone', 'role'])
        );
    }

    public function index(Request $request)
    {
        $this->expirer();
        $user = $request->user();

        $query = Mandat::with([
            'bien:id,titre,quartier,ville,prix,transaction,photos',
            'proprietaire:id,nom,prenom',
            'agence:id,nom,prenom',
            'agent:id,nom,prenom',
        ])->latest();

        match ($user->role) {
            'proprietaire'    => $query->where('proprietaire_id', $user->id),
            'agent', 'agence' => $query->where(fn ($q) => $q->where('agent_id', $user->id)->orWhere('agence_id', $user->id)),
            default           => null,
        };

        if (!in_array($user->role, ['proprietaire', 'agence', 'agent'], true)) {
            return $this->refus('Accès refusé.', 403);
        }

        return response()->json($query->get());
    }

    // Biens actuellement gérés (mandat actif), avec l'état de leur annonce
    public function biensGeres(Request $request)
    {
        $this->expirer();
        $user = $request->user();

        if (!in_array($user->role, ['agence', 'agent'], true)) {
            return $this->refus('Accès refusé.', 403);
        }

        $query = Mandat::with([
            'bien.annonces' => fn ($q) => $q->latest()
                ->select('id', 'bien_id', 'statut', 'motif_rejet', 'created_at'),
            'proprietaire:id,nom,prenom',
            'agent:id,nom,prenom',
        ])->where('statut', 'actif')->whereDate('date_fin', '>=', today())->latest();

        $query->where(fn ($q) => $q->where('agent_id', $user->id)->orWhere('agence_id', $user->id));

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $this->expirer();
        $user = $request->user();

        if ($user->role !== 'proprietaire') {
            return $this->refus('Seuls les propriétaires peuvent confier un bien.', 403);
        }

        $data = $request->validate([
            'bien_id'        => 'required|exists:biens,id',
            'agence_id'      => 'required|exists:users,id',
            'type'           => 'required|in:simple,exclusif',
            'commission_pct' => 'required|numeric|min:0.5|max:30',
            'date_debut'     => 'required|date|after_or_equal:today',
            'date_fin'       => 'required|date|after:date_debut',
        ], [
            'date_debut.after_or_equal' => 'La date de début ne peut pas être dans le passé.',
            'date_fin.after'            => 'La date de fin doit suivre la date de début.',
            'commission_pct.max'        => 'La commission ne peut pas dépasser 30 %.',
        ]);

        $bien = Bien::findOrFail($data['bien_id']);

        if ($bien->proprietaire_id !== $user->id) {
            return $this->refus('Ce bien ne vous appartient pas.', 403);
        }

        if ($bien->statut !== 'disponible') {
            return $this->refus('Ce bien n\'est plus disponible.');
        }

        $agence = User::where('id', $data['agence_id'])
            ->whereIn('role', ['agent', 'agence'])
            ->where('statut', 'actif')
            ->first();

        if (!$agence) {
            return $this->refus('Agent immobilier introuvable.');
        }

        $enCours = Mandat::where('bien_id', $bien->id)->whereIn('statut', ['propose', 'actif'])->exists();

        if ($enCours) {
            return $this->refus('Ce bien a déjà un mandat en cours ou en attente de réponse.');
        }

        $mandat = Mandat::create([
            'bien_id'         => $bien->id,
            'proprietaire_id' => $user->id,
            'agence_id'       => $agence->id,
            'agent_id'        => $agence->id,
            'type'            => $data['type'],
            'commission_pct'  => $data['commission_pct'],
            'date_debut'      => $data['date_debut'],
            'date_fin'        => $data['date_fin'],
        ]);

        return response()->json($mandat, 201);
    }

    public function update(Request $request, Mandat $mandat)
    {
        $this->expirer();
        $mandat->refresh();
        $user = $request->user();

        $data = $request->validate([
            'action' => 'required|in:accepter,refuser,annuler,resilier',
            'motif'  => 'required_if:action,refuser|nullable|string|max:500',
        ], ['motif.required_if' => 'Indiquez le motif du refus.']);

        $estProprio = $mandat->proprietaire_id === $user->id;
        $estAgence = $mandat->agence_id === $user->id || $mandat->agent_id === $user->id;

        if (!$estProprio && !$estAgence) {
            return $this->refus('Accès refusé.', 403);
        }

        switch ($data['action']) {
            case 'accepter':
                if (!$estAgence) return $this->refus('Action réservée à l\'agent immobilier.', 403);
                if ($mandat->statut !== 'propose') return $this->refus('Ce mandat a déjà été traité.');
                if ($mandat->date_fin->lt(today())) return $this->refus('La date de fin du mandat est dépassée.');
                if ($mandat->bien->statut !== 'disponible') return $this->refus('Ce bien n\'est plus disponible.');

                $autreActif = Mandat::where('bien_id', $mandat->bien_id)
                    ->where('id', '!=', $mandat->id)->where('statut', 'actif')->exists();
                if ($autreActif) return $this->refus('Ce bien est déjà sous mandat actif.');

                $mandat->update(['statut' => 'actif']);
                break;

            case 'refuser':
                if (!$estAgence) return $this->refus('Action réservée à l\'agent immobilier.', 403);
                if ($mandat->statut !== 'propose') return $this->refus('Ce mandat a déjà été traité.');

                $mandat->update(['statut' => 'refuse', 'motif_refus' => $data['motif']]);
                break;

            case 'annuler':
                if (!$estProprio) return $this->refus('Action réservée au propriétaire.', 403);
                if ($mandat->statut !== 'propose') return $this->refus('Seule une proposition en attente peut être annulée.');

                $mandat->update(['statut' => 'annule']);
                break;

            case 'resilier':
                if ($mandat->statut !== 'actif') return $this->refus('Seul un mandat actif peut être résilié.');

                $mandat->update(['statut' => 'resilie']);
                break;
        }

        return response()->json($mandat->fresh());
    }

    // L'agence assigne (ou retire) un agent sur un mandat actif
    public function assigner(Request $request, Mandat $mandat)
    {
        $user = $request->user();

        if ($user->role !== 'agence' || $mandat->agence_id !== $user->id) {
            return $this->refus('Accès refusé.', 403);
        }

        if ($mandat->statut !== 'actif') {
            return $this->refus('Seul un mandat actif peut être assigné.');
        }

        $data = $request->validate(['agent_id' => 'nullable|exists:users,id']);

        if (!empty($data['agent_id'])) {
            $agent = User::where('id', $data['agent_id'])
                ->where('role', 'agent')
                ->where('agence_id', $user->id)
                ->where('statut', 'actif')
                ->first();

            if (!$agent) {
                return $this->refus('Agent introuvable ou inactif.');
            }
        }

        $mandat->update(['agent_id' => $data['agent_id'] ?? null]);

        return response()->json($mandat->fresh());
    }
}