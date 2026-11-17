<?php

namespace App\Models;

use App\Enums\Role;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Proprietaire du diagramme : possède des biens, publie, crée les baux, détient un portefeuille. */
class Proprietaire extends Utilisateur
{
    use DetientPortefeuille;

    public const ROLE = 'proprietaire';

    private const DECIMALES_NOTE = 1;

    public function role(): Role
    {
        return Role::PROPRIETAIRE;
    }

    /** Association « possède » : un bien a un seul propriétaire. */
    public function biens(): HasMany
    {
        return $this->hasMany(Bien::class, 'proprietaire_id');
    }

    public function contrats(): HasMany
    {
        return $this->hasMany(Contrat::class, 'proprietaire_id');
    }

    /** Attribut identiteVerifiee du diagramme. */
    public function identiteVerifiee(): bool
    {
        return (bool) $this->est_verifie;
    }

    public function indicateursTableauDeBord(): array
    {
        return [
            'biens' => Bien::where('proprietaire_id', $this->id)->count(),
            'annonces_publiees' => Annonce::where('auteur_id', $this->id)->where('statut', 'publiee')->count(),
            'annonces_en_attente' => Annonce::where('auteur_id', $this->id)->where('statut', 'en_attente')->count(),
            'visites_en_attente' => Visite::where('proprietaire_id', $this->id)->where('statut', 'en_attente')->count(),
            'offres_en_attente' => OffreAchat::where('proprietaire_id', $this->id)->where('statut', 'en_attente')->count(),
            'nb_avis' => Notation::where('note_id', $this->id)->count(),
            'note_moyenne' => round((float) Notation::where('note_id', $this->id)->avg('note'), self::DECIMALES_NOTE),
            'messages_non_lus' => $this->messagesNonLus(),
            'solde' => $this->soldeDisponible(),
        ];
    }
}
