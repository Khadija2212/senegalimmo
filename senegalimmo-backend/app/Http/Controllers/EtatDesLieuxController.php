<?php

namespace App\Http\Controllers;

use App\Models\Contrat;
use App\Models\EtatDesLieux;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EtatDesLieuxController extends Controller
{
    private function estPartie(Request $request, Contrat $contrat): bool
    {
        $id = $request->user()->id;

        return $contrat->proprietaire_id === $id || $contrat->locataire_id === $id;
    }

    // États des lieux d'un bail
    public function index(Request $request)
    {
        $data = $request->validate(['contrat_id' => 'required|exists:contrats,id']);
        $contrat = Contrat::findOrFail($data['contrat_id']);

        if (!$this->estPartie($request, $contrat)) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        return response()->json(
            EtatDesLieux::where('contrat_id', $contrat->id)->orderBy('type')->get()
        );
    }

    // Le propriétaire établit l'état des lieux
    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'proprietaire') {
            return response()->json(['message' => 'Action réservée au propriétaire.'], 403);
        }

        $data = $request->validate([
            'contrat_id'   => 'required|exists:contrats,id',
            'type'         => 'required|in:entree,sortie',
            'pieces'       => 'required|json',
            'observations' => 'nullable|string|max:2000',
            'photos'       => 'nullable|array|max:8',
            'photos.*'     => 'image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        $contrat = Contrat::findOrFail($data['contrat_id']);

        if ($contrat->proprietaire_id !== $user->id) {
            return response()->json(['message' => 'Ce bail ne concerne pas vos biens.'], 403);
        }

        if ($contrat->statut !== 'signe') {
            return response()->json(['message' => 'Le bail doit d\'abord être signé par les deux parties.'], 422);
        }

        if (EtatDesLieux::where('contrat_id', $contrat->id)->where('type', $data['type'])->exists()) {
            return response()->json(['message' => 'Cet état des lieux existe déjà.'], 422);
        }

        if ($data['type'] === 'sortie') {
            $entreeValidee = EtatDesLieux::where('contrat_id', $contrat->id)
                ->where('type', 'entree')
                ->where('valide_locataire', true)
                ->exists();

            if (!$entreeValidee) {
                return response()->json(
                    ['message' => 'L\'état des lieux d\'entrée doit d\'abord être validé par le locataire.'],
                    422
                );
            }
        }

        $pieces = json_decode($data['pieces'], true);

        Validator::make(['pieces' => $pieces], [
            'pieces'            => 'required|array|min:1|max:30',
            'pieces.*.piece'    => 'required|string|max:60',
            'pieces.*.etat'     => 'required|in:bon,moyen,mauvais',
            'pieces.*.remarque' => 'nullable|string|max:300',
        ])->validate();

        $chemins = [];
        foreach ($request->file('photos', []) as $photo) {
            $chemins[] = $photo->store('etats-des-lieux', 'public');
        }

        $etat = EtatDesLieux::create([
            'contrat_id'   => $contrat->id,
            'type'         => $data['type'],
            'pieces'       => $pieces,
            'observations' => $data['observations'] ?? null,
            'photos'       => $chemins,
        ]);

        return response()->json($etat, 201);
    }

    // Le locataire valide l'état des lieux
    public function valider(Request $request, EtatDesLieux $etat)
    {
        $contrat = $etat->contrat;

        if ($contrat->locataire_id !== $request->user()->id) {
            return response()->json(['message' => 'Seul le locataire peut valider.'], 403);
        }

        if ($etat->valide_locataire) {
            return response()->json(['message' => 'Déjà validé.'], 422);
        }

        $data = $request->validate(['remarque' => 'nullable|string|max:500']);

        $etat->update([
            'valide_locataire'   => true,
            'valide_le'          => now(),
            'remarque_locataire' => $data['remarque'] ?? null,
        ]);

        return response()->json($etat);
    }
}