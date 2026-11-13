<?php

namespace App\Http\Controllers;

use App\Models\Bien;
use App\Models\OffreAchat;
use Illuminate\Http\Request;

class OffreAchatController extends Controller
{
    private function refus(string $message, int $code = 422)
    {
        return response()->json(['message' => $message], $code);
    }

    // Propriétaire : offres reçues. Acheteur : ses offres.
    public function index(Request $request)
    {
        $user = $request->user();

        $query = OffreAchat::with([
            'bien:id,titre,quartier,ville,prix,photos',
            'acheteur:id,nom,prenom,telephone',
            'proprietaire:id,nom,prenom',
            'promesse:id,offre_id,statut',
        ])->latest();

        if ($user->role === 'proprietaire') {
            $query->where('proprietaire_id', $user->id);
        } elseif (in_array($user->role, ['acheteur', 'client'])) {
            $query->where('acheteur_id', $user->id);
        } else {
            return $this->refus('Accès refusé.', 403);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['acheteur', 'client'])) {
            return $this->refus('Seuls les acheteurs et clients peuvent faire une offre.', 403);
        }

        $data = $request->validate([
            'bien_id' => 'required|exists:biens,id',
            'montant' => 'required|numeric|min:1',
            'message' => 'nullable|string|max:1000',
        ]);

        $bien = Bien::findOrFail($data['bien_id']);

        if ($bien->transaction !== 'vente') {
            return $this->refus('Ce bien n\'est pas en vente.');
        }

        if ($bien->statut !== 'disponible') {
            return $this->refus('Ce bien n\'est plus disponible.');
        }

        $dejaActive = OffreAchat::where('bien_id', $bien->id)
            ->where('acheteur_id', $user->id)
            ->whereIn('statut', ['en_attente', 'contre_proposee', 'acceptee'])
            ->exists();

        if ($dejaActive) {
            return $this->refus('Vous avez déjà une offre en cours pour ce bien.');
        }

        $offre = OffreAchat::create([
            'bien_id'         => $bien->id,
            'acheteur_id'     => $user->id,
            'proprietaire_id' => $bien->proprietaire_id,
            'montant_offre'   => $data['montant'],
            'message'         => $data['message'] ?? null,
        ]);

        return response()->json($offre, 201);
    }

    // Négociation : une seule route, plusieurs actions
    public function update(Request $request, OffreAchat $offre)
    {
        $user = $request->user();

        $data = $request->validate([
            'action'  => 'required|in:accepter,refuser,contre,accepter_contre,nouvelle_offre,annuler',
            'montant' => 'required_if:action,contre,nouvelle_offre|nullable|numeric|min:1',
            'motif'   => 'required_if:action,refuser|nullable|string|max:500',
        ], [
            'montant.required_if' => 'Indiquez le montant.',
            'motif.required_if'   => 'Indiquez le motif du refus.',
        ]);

        $estProprio = $offre->proprietaire_id === $user->id;
        $estAcheteur = $offre->acheteur_id === $user->id;

        if (!$estProprio && !$estAcheteur) {
            return $this->refus('Accès refusé.', 403);
        }

        $action = $data['action'];

        // Actions réservées au propriétaire
        if (in_array($action, ['accepter', 'refuser', 'contre'], true)) {
            if (!$estProprio) {
                return $this->refus('Action réservée au propriétaire.', 403);
            }
            if ($offre->statut !== 'en_attente') {
                return $this->refus('Cette offre a déjà été traitée.');
            }
        }

        // Actions réservées à l'acheteur
        if (in_array($action, ['accepter_contre', 'nouvelle_offre', 'annuler'], true) && !$estAcheteur) {
            return $this->refus('Action réservée à l\'acheteur.', 403);
        }

        if (in_array($action, ['accepter', 'accepter_contre'], true)) {
            if ($offre->bien->statut !== 'disponible') {
                return $this->refus('Ce bien n\'est plus disponible.');
            }

            $autreAcceptee = OffreAchat::where('bien_id', $offre->bien_id)
                ->where('id', '!=', $offre->id)
                ->where('statut', 'acceptee')
                ->exists();

            if ($autreAcceptee) {
                return $this->refus('Une autre offre est déjà acceptée pour ce bien.');
            }
        }

        switch ($action) {
            case 'accepter':
                $offre->update([
                    'statut'        => 'acceptee',
                    'montant_final' => $offre->montant_offre,
                ]);
                break;

            case 'refuser':
                $offre->update(['statut' => 'refusee', 'motif_refus' => $data['motif']]);
                break;

            case 'contre':
                $offre->update(['statut' => 'contre_proposee', 'montant_contre' => $data['montant']]);
                break;

            case 'accepter_contre':
                if ($offre->statut !== 'contre_proposee') {
                    return $this->refus('Aucune contre-proposition à accepter.');
                }
                $offre->update([
                    'statut'        => 'acceptee',
                    'montant_final' => $offre->montant_contre,
                ]);
                break;

            case 'nouvelle_offre':
                if ($offre->statut !== 'contre_proposee') {
                    return $this->refus('Une nouvelle offre n\'est possible qu\'après une contre-proposition.');
                }
                $offre->update([
                    'statut'         => 'en_attente',
                    'montant_offre'  => $data['montant'],
                    'montant_contre' => null,
                ]);
                break;

            case 'annuler':
                if (!in_array($offre->statut, ['en_attente', 'contre_proposee', 'acceptee'], true)) {
                    return $this->refus('Cette offre ne peut plus être annulée.');
                }
                if ($offre->promesse()->exists()) {
                    return $this->refus('Une promesse de vente existe déjà pour cette offre.');
                }
                $offre->update(['statut' => 'annulee']);
                break;
        }

        return response()->json($offre->fresh());
    }
}