<?php

namespace App\Models;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Client du diagramme : cherche, visite, loue ou achète, paie. */
class Client extends Utilisateur
{
    public const ROLE = 'client';

    private const OFFRES_EN_COURS = ['en_attente', 'contre_proposee'];

    public function role(): Role
    {
        return Role::CLIENT;
    }

    public function contrats(): HasMany
    {
        return $this->hasMany(Contrat::class, 'locataire_id');
    }

    public function favoris(): HasMany
    {
        return $this->hasMany(Favori::class, 'user_id');
    }

    public function biensFavoris(): BelongsToMany
    {
        return $this->belongsToMany(Bien::class, 'favoris', 'user_id', 'bien_id');
    }

    public function signalements(): HasMany
    {
        return $this->hasMany(Signalement::class, 'user_id');
    }

    public function indicateursTableauDeBord(): array
    {
        return [
            'demandes_location' => DemandeLocation::where('locataire_id', $this->id)->count(),
            'baux_actifs' => Contrat::where('locataire_id', $this->id)->where('statut', 'signe')->count(),
            'offres_achat' => OffreAchat::where('acheteur_id', $this->id)->count(),
            'offres_en_cours' => OffreAchat::where('acheteur_id', $this->id)->whereIn('statut', self::OFFRES_EN_COURS)->count(),
            'offres_acceptees' => OffreAchat::where('acheteur_id', $this->id)->where('statut', 'acceptee')->count(),
            'promesses' => PromesseVente::where('acheteur_id', $this->id)->where('statut', 'signee')->count(),
            'visites' => Visite::where('demandeur_id', $this->id)->count(),
            'favoris' => Favori::where('user_id', $this->id)->count(),
            'messages_non_lus' => $this->messagesNonLus(),
        ];
    }
}
