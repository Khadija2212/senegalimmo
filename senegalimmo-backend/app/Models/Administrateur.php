<?php

namespace App\Models;

use App\Enums\Role;
use App\Enums\RoleAdmin;
use App\Enums\StatutPaiement;
use App\Enums\StatutRetrait;
use App\Services\Paiement\GestionRetraits;

/**
 * Administrateur du diagramme : hérite de Compte mais pas d'Utilisateur
 * (ni favoris, ni messagerie, ni portefeuille).
 */
class Administrateur extends Compte
{
    public const ROLE = 'administrateur';

    protected $attributes = ['niveau' => 'super_admin'];

    public function role(): Role
    {
        return Role::ADMINISTRATEUR;
    }

    public function niveau(): RoleAdmin
    {
        return RoleAdmin::from((string) $this->niveau);
    }

    /** Opération validerRetrait du diagramme. */
    public function validerRetrait(Retrait $r): Retrait
    {
        return app(GestionRetraits::class)->valider($r, $this);
    }

    /** Indicateurs du cas « Consulter le tableau de bord » (page Administrateur). @return array<string, int> */
    public function indicateursAdministration(): array
    {
        return [
            'utilisateurs' => Compte::tous()->where('role', '!=', self::ROLE)->count(),
            'annonces_en_attente' => Annonce::where('statut', 'en_attente')->count(),
            'retraits_en_attente' => Retrait::where('statut', StatutRetrait::DEMANDE)->count(),
            'volume' => (int) Paiement::tous()->where('statut', StatutPaiement::REUSSI)->sum('montant'),
            'verifications_en_attente' => Compte::tous()->where('verification', 'en_attente')->count(),
        ];
    }
}
