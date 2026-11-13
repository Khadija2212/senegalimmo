<?php

namespace App\Http\Controllers;

use App\Models\Annonce;
use App\Models\OffreAchat;
use App\Models\PromesseVente;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;

class PromesseVenteController extends Controller
{
    private function estPartie(Request $request, PromesseVente $promesse): bool
    {
        $id = $request->user()->id;

        return $promesse->vendeur_id === $id || $promesse->acheteur_id === $id;
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $query = PromesseVente::with([
            'bien:id,titre,quartier,ville,photos',
            'vendeur:id,nom,prenom,telephone',
            'acheteur:id,nom,prenom,telephone',
        ])->latest();

        if ($user->role === 'proprietaire') {
            $query->where('vendeur_id', $user->id);
        } elseif (in_array($user->role, ['acheteur', 'client'])) {
            $query->where('acheteur_id', $user->id);
        } else {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return response()->json($query->get());
    }

    // Le propriétaire établit la promesse à partir d'une offre acceptée
    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'proprietaire') {
            return response()->json(['message' => 'Action réservée aux propriétaires.'], 403);
        }

        $data = $request->validate([
            'offre_id'  => 'required|exists:offres_achat,id',
            'date_limite' => 'required|date|after:today',
            'indemnite' => 'nullable|numeric|min:0',
            'conditions' => 'nullable|string|max:1500',
        ], [
            'date_limite.after' => 'La date limite doit être dans le futur.',
        ]);

        $offre = OffreAchat::with('bien')->findOrFail($data['offre_id']);

        if ($offre->proprietaire_id !== $user->id) {
            return response()->json(['message' => 'Cette offre ne concerne pas vos biens.'], 403);
        }

        if ($offre->statut !== 'acceptee') {
            return response()->json(['message' => 'L\'offre doit d\'abord être acceptée.'], 422);
        }

        if ($offre->promesse()->exists()) {
            return response()->json(['message' => 'Une promesse existe déjà pour cette offre.'], 422);
        }

        if ($offre->bien->statut !== 'disponible') {
            return response()->json(['message' => 'Ce bien n\'est plus disponible.'], 422);
        }

        $indemnite = (float) ($data['indemnite'] ?? 0);

        if ($indemnite > (float) $offre->montant_final) {
            return response()->json(['message' => 'L\'indemnité ne peut pas dépasser le prix convenu.'], 422);
        }

        $promesse = PromesseVente::create([
            'offre_id'                 => $offre->id,
            'bien_id'                  => $offre->bien_id,
            'vendeur_id'               => $user->id,
            'acheteur_id'              => $offre->acheteur_id,
            'prix_convenu'             => $offre->montant_final,
            'indemnite_immobilisation' => $indemnite,
            'date_limite'              => $data['date_limite'],
            'conditions'               => $data['conditions'] ?? null,
        ]);

        return response()->json($promesse, 201);
    }

    // Signature électronique simple (clic de confirmation horodaté)
    public function signer(Request $request, PromesseVente $promesse)
    {
        if (!$this->estPartie($request, $promesse)) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if ($promesse->statut !== 'en_attente') {
            return response()->json(['message' => 'Cette promesse ne peut plus être signée.'], 422);
        }

        if ($promesse->vendeur_id === $request->user()->id) {
            if ($promesse->signe_vendeur) {
                return response()->json(['message' => 'Vous avez déjà signé.'], 422);
            }
            $promesse->signe_vendeur = true;
            $promesse->signe_vendeur_le = now();
        } else {
            if ($promesse->signe_acheteur) {
                return response()->json(['message' => 'Vous avez déjà signé.'], 422);
            }
            $promesse->signe_acheteur = true;
            $promesse->signe_acheteur_le = now();
        }

        if ($promesse->signe_vendeur && $promesse->signe_acheteur) {
            $promesse->statut = 'signee';
        }

        $promesse->save();

        if ($promesse->statut === 'signee') {
            $this->finaliser($promesse);
        }

        return response()->json($promesse);
    }

    // Les deux parties ont signé : le bien est vendu
    private function finaliser(PromesseVente $promesse): void
    {
         app(\App\Services\CommissionService::class)->pourVente($promesse);
        $promesse->bien()->update(['statut' => 'vendu']);

        Annonce::where('bien_id', $promesse->bien_id)
            ->whereIn('statut', ['en_attente', 'publiee'])
            ->update(['statut' => 'expiree']);

        OffreAchat::where('bien_id', $promesse->bien_id)
            ->where('id', '!=', $promesse->offre_id)
            ->whereIn('statut', ['en_attente', 'contre_proposee', 'acceptee'])
            ->update(['statut' => 'refusee', 'motif_refus' => 'Ce bien a été vendu.']);

    }

    public function pdf(Request $request, PromesseVente $promesse)
    {
        if (!$this->estPartie($request, $promesse)) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $promesse->load(['bien', 'vendeur', 'acheteur']);

        $options = new Options();
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', false);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml(view('pdf.promesse', ['promesse' => $promesse])->render());
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="promesse-' . $promesse->id . '.pdf"',
        ]);
    }
}