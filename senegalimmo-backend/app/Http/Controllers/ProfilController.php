<?php

namespace App\Http\Controllers;

use App\Contracts\ServiceStockage;
use App\Models\Administrateur;
use App\Models\Agent;
use App\Models\Client;
use App\Models\Proprietaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rules\Password;

/** Cas « Gérer son profil » : identité, attributs propres à chaque classe, mot de passe, pièces. */
class ProfilController extends Controller
{
    private const LONGUEUR_MIN_MOT_DE_PASSE = 8;

    private const TAILLE_MAX_KO = 5120;

    private const DUREE_LIEN_MIN = 15;

    public function __construct(private readonly ServiceStockage $stockage) {}

    public function modifier(Request $request): JsonResponse
    {
        $compte = $request->user();
        $donnees = $request->validate([
            'prenom' => ['required', 'string', 'max:100'],
            'nom' => ['required', 'string', 'max:100'],
            'telephone' => ['sometimes', 'string', 'regex:/^\+?[0-9 ]{9,15}$/'],
            'photo' => ['sometimes', 'image', 'max:'.self::TAILLE_MAX_KO],
        ] + $this->reglesPropres($compte));

        $photo = $request->file('photo');
        $compte->modifierProfil($donnees['prenom'], $donnees['nom'], $photo ? $this->ranger($photo, 'photos') : null);
        $compte->update(collect($donnees)->except(['prenom', 'nom', 'photo'])->all());

        return response()->json($compte->fresh());
    }

    public function changerMotDePasse(Request $request): JsonResponse
    {
        $donnees = $request->validate([
            'ancien' => ['required', 'string'],
            'nouveau' => ['required', 'confirmed', Password::min(self::LONGUEUR_MIN_MOT_DE_PASSE)],
        ]);
        $request->user()->changerMotDePasse($donnees['ancien'], $donnees['nouveau']);

        return response()->json(['message' => 'Mot de passe modifié.']);
    }

    /** La pièce d'identité du client, du propriétaire ou la carte professionnelle de l'agent. */
    public function televerserPieceIdentite(Request $request): JsonResponse
    {
        $request->validate(['fichier' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:'.self::TAILLE_MAX_KO]]);
        $compte = $request->user();
        $this->exigerQue(! $compte instanceof Administrateur);
        $compte->update(['piece_identite_url' => $this->ranger($request->file('fichier'), 'pieces')]);

        return response()->json(['message' => "Pièce d'identité envoyée."]);
    }

    public function pieceIdentite(Request $request): JsonResponse
    {
        $url = $request->user()->piece_identite_url;
        $this->exigerQue($url !== null, "Aucune pièce d'identité envoyée.");

        return response()->json(['url' => $this->stockage->urlSignee($url, self::DUREE_LIEN_MIN)]);
    }

    /** @return array<string, list<string>> */
    private function reglesPropres(object $compte): array
    {
        return match (true) {
            $compte instanceof Client => ['date_naissance' => ['sometimes', 'nullable', 'date', 'before:today'], 'profession' => ['sometimes', 'nullable', 'string', 'max:120']],
            $compte instanceof Proprietaire => ['adresse' => ['sometimes', 'nullable', 'string', 'max:255']],
            $compte instanceof Agent => ['agence' => ['sometimes', 'nullable', 'string', 'max:120'], 'numero_carte_professionnelle' => ['sometimes', 'nullable', 'string', 'max:60']],
            default => [],
        };
    }

    private function ranger(UploadedFile $fichier, string $dossier): string
    {
        return $this->stockage->televerser((string) $fichier->get(), $dossier.'/'.$fichier->hashName());
    }
}
