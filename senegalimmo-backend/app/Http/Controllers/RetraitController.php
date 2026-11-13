<?php

namespace App\Http\Controllers;

use App\Models\DemandeRetrait;
use App\Services\Portefeuille;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RetraitController extends Controller
{
    private function refus(string $message = 'Accès refusé.', int $code = 403)
    {
        return response()->json(['message' => $message], $code);
    }

    // Le propriétaire ou l'agence demande un retrait : le montant est bloqué tout de suite
    public function demander(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['proprietaire', 'agence', 'agent'], true)) {
            return $this->refus();
        }

        $minimum = (int) config('services.retrait.minimum');

        $data = $request->validate([
            'montant'          => 'required|numeric|min:1',
            'methode'          => 'required|in:wave,orange_money,virement',
            'numero_telephone' => 'required|string|max:30',
        ]);

        if ((float) $data['montant'] < $minimum) {
            return $this->refus('Le montant minimum d\'un retrait est de ' . number_format($minimum, 0, ',', ' ') . ' FCFA.', 422);
        }

        try {
            $retrait = DB::transaction(function () use ($user, $data) {
                $retrait = DemandeRetrait::create([
                    'user_id'          => $user->id,
                    'montant'          => $data['montant'],
                    'methode'          => $data['methode'],
                    'numero_telephone' => $data['numero_telephone'],
                    'statut'           => 'en_attente',
                ]);

                $ok = Portefeuille::debiter(
                    $user->id,
                    (float) $data['montant'],
                    'Demande de retrait n°' . $retrait->id . ' (en attente de traitement)'
                );

                if (!$ok) {
                    throw new \RuntimeException('solde');
                }

                return $retrait;
            });
        } catch (\RuntimeException $e) {
            return $this->refus('Solde insuffisant.', 422);
        }

        return response()->json($retrait, 201);
    }

    // Preuve de transfert : visible par le demandeur et par l'administrateur
    public function preuve(Request $request, DemandeRetrait $retrait)
    {
        $user = $request->user();

        if ($user->role !== 'administrateur' && $retrait->user_id !== $user->id) {
            return $this->refus();
        }

        $chemin = $retrait->getRawOriginal('preuve');

        if (!$chemin || !Storage::disk('local')->exists($chemin)) {
            return $this->refus('Aucune preuve disponible.', 404);
        }

        return Storage::disk('local')->response($chemin);
    }

    public function adminIndex(Request $request)
    {
        if ($request->user()->role !== 'administrateur') {
            return $this->refus();
        }

        $query = DemandeRetrait::with('user:id,nom,prenom,role,telephone')
            ->orderByRaw("case when statut = 'en_attente' then 0 else 1 end")
            ->orderByDesc('id')
            ->limit(200);

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        $retraits = $query->get();
        $retraits->each(fn ($r) => $r->setAttribute('a_preuve', !empty($r->getRawOriginal('preuve'))));

        return response()->json($retraits);
    }

    // L'administrateur valide (après transfert manuel) ou rejette (remboursement)
    public function traiter(Request $request, DemandeRetrait $retrait)
    {
        if ($request->user()->role !== 'administrateur') {
            return $this->refus();
        }

        if ($retrait->statut !== 'en_attente') {
            return $this->refus('Cette demande a déjà été traitée.', 422);
        }

        $data = $request->validate([
            'decision'  => 'required|in:validee,rejetee',
            'motif'     => 'required_if:decision,rejetee|nullable|string|max:500',
            'reference' => 'nullable|string|max:80',
            'preuve'    => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ], [
            'motif.required_if' => 'Indiquez le motif du rejet.',
        ]);

        DB::transaction(function () use ($retrait, $data, $request) {
            if ($data['decision'] === 'validee') {
                $chemin = $request->hasFile('preuve')
                    ? $request->file('preuve')->store('preuves-retrait', 'local')
                    : null;

                $retrait->update([
                    'statut'              => 'validee',
                    'traitee_le'          => now(),
                    'preuve'              => $chemin,
                    'reference_transfert' => $data['reference'] ?? null,
                ]);
            } else {
                $retrait->update([
                    'statut'      => 'rejetee',
                    'traitee_le'  => now(),
                    'motif_rejet' => $data['motif'],
                ]);

                Portefeuille::crediter(
                    $retrait->user_id,
                    (float) $retrait->montant,
                    'Retrait n°' . $retrait->id . ' rejeté : remboursement'
                );
            }
        });

        return response()->json($retrait->fresh());
    }
}