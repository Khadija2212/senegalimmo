<?php

namespace App\Http\Controllers;

use App\Models\Annonce;
use App\Models\Contrat;
use App\Models\DemandeLocation;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ContratController extends Controller
{
    private function estPartie(Request $request, Contrat $contrat): bool
    {
        $id = $request->user()->id;

        return $contrat->proprietaire_id === $id || $contrat->locataire_id === $id;
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $query = Contrat::with([
            'bien:id,titre,quartier,ville,photos',
            'proprietaire:id,nom,prenom,telephone',
            'locataire:id,nom,prenom,telephone',
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

    // Le propriétaire établit le bail à partir d'une demande acceptée
    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'proprietaire') {
            return response()->json(['message' => 'Action réservée aux propriétaires.'], 403);
        }

        $data = $request->validate([
            'demande_id'    => 'required|exists:demandes_location,id',
            'date_debut'    => 'required|date|after_or_equal:today',
            'duree_mois'    => 'required|integer|min:1|max:120',
            'loyer_mensuel' => 'required|numeric|min:0',
            'caution'       => 'nullable|numeric|min:0',
        ], [
            'date_debut.after_or_equal' => 'La date de début ne peut pas être dans le passé.',
        ]);

        $demande = DemandeLocation::findOrFail($data['demande_id']);

        if ($demande->proprietaire_id !== $user->id) {
            return response()->json(['message' => 'Cette demande ne concerne pas vos biens.'], 403);
        }

        if ($demande->statut !== 'acceptee') {
            return response()->json(['message' => 'La demande doit d\'abord être acceptée.'], 422);
        }

        if (Contrat::where('demande_id', $demande->id)->exists()) {
            return response()->json(['message' => 'Un bail existe déjà pour cette demande.'], 422);
        }

        $debut = Carbon::parse($data['date_debut']);

        $contrat = Contrat::create([
            'bien_id'         => $demande->bien_id,
            'demande_id'      => $demande->id,
            'proprietaire_id' => $user->id,
            'locataire_id'    => $demande->locataire_id,
            'type'            => 'bail',
            'date_debut'      => $debut,
            'date_fin'        => $debut->copy()->addMonthsNoOverflow($data['duree_mois'])->subDay(),
            'duree_mois'      => $data['duree_mois'],
            'loyer_mensuel'   => $data['loyer_mensuel'],
            'caution'         => $data['caution'] ?? 0,
            'statut'          => 'en_attente',
        ]);

        return response()->json($contrat, 201);
    }

    public function show(Request $request, Contrat $contrat)
    {
        if (!$this->estPartie($request, $contrat)) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return response()->json($contrat->load(['bien', 'proprietaire:id,nom,prenom', 'locataire:id,nom,prenom']));
    }

    // Signature électronique simple (clic de confirmation horodaté)
    public function signer(Request $request, Contrat $contrat)
    {
        if (!$this->estPartie($request, $contrat)) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if ($contrat->statut !== 'en_attente') {
            return response()->json(['message' => 'Ce bail ne peut plus être signé.'], 422);
        }

        $userId = $request->user()->id;

        if ($contrat->proprietaire_id === $userId) {
            if ($contrat->signe_proprietaire) {
                return response()->json(['message' => 'Vous avez déjà signé ce bail.'], 422);
            }
            $contrat->signe_proprietaire = true;
            $contrat->signe_proprietaire_le = now();
        } else {
            if ($contrat->signe_locataire) {
                return response()->json(['message' => 'Vous avez déjà signé ce bail.'], 422);
            }
            $contrat->signe_locataire = true;
            $contrat->signe_locataire_le = now();
        }

        if ($contrat->signe_proprietaire && $contrat->signe_locataire) {
            $contrat->statut = 'signe';
        }

        $contrat->save();

        if ($contrat->statut === 'signe') {
            $this->finaliser($contrat);
        }

        return response()->json($contrat);
    }

    // Les deux parties ont signé : le bien est loué
    private function finaliser(Contrat $contrat): void
    {
       app(\App\Services\CommissionService::class)->pourBail($contrat);
        $contrat->bien()->update(['statut' => 'loue']);

        Annonce::where('bien_id', $contrat->bien_id)
            ->whereIn('statut', ['en_attente', 'publiee'])
            ->update(['statut' => 'expiree']);

        DemandeLocation::where('bien_id', $contrat->bien_id)
            ->where('id', '!=', $contrat->demande_id)
            ->where('statut', 'en_attente')
            ->update(['statut' => 'refusee', 'motif_refus' => 'Ce bien a été loué.']);
        
    }

    // Génération du bail en PDF
    public function pdf(Request $request, Contrat $contrat)
    {
        if (!$this->estPartie($request, $contrat)) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $contrat->load(['bien', 'proprietaire', 'locataire']);

        $options = new Options();
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', false);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml(view('pdf.bail', ['contrat' => $contrat])->render());
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="bail-' . $contrat->id . '.pdf"',
        ]);
    }

    public function update()
    {
        return response()->json(['message' => 'Modification non autorisée.'], 405);
    }

    public function destroy()
    {
        return response()->json(['message' => 'Suppression non autorisée.'], 405);
    }
}