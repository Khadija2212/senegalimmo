<?php

namespace App\Models;

use App\Enums\DecisionModeration;
use App\Enums\Role;
use App\Enums\RoleAdmin;
use App\Enums\StatutAnnonce;
use App\Enums\StatutCompte;
use App\Enums\StatutPaiement;
use App\Enums\StatutRetrait;
use App\Enums\StatutSignalement;
use App\Enums\StatutValidation;
use App\Exceptions\OperationRefusee;
use App\Services\Paiement\GestionRetraits;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Administrateur du diagramme : hérite de Compte mais pas d'Utilisateur
 * (ni favoris, ni messagerie, ni portefeuille). Son niveau RoleAdmin borne ce qu'il traite.
 */
class Administrateur extends Compte
{
    protected $attributes = ['niveau' => 'super_admin'];

    protected function casts(): array
    {
        return ['niveau' => RoleAdmin::class];
    }

    public function role(): Role
    {
        return Role::ADMINISTRATEUR;
    }

    /** Ce niveau peut-il traiter ce domaine ? Le super administrateur traite tout. */
    public function peut(RoleAdmin $domaine): bool
    {
        return $this->niveau === RoleAdmin::SUPER_ADMIN || $this->niveau === $domaine;
    }

    /** Association « définit » : Administrateur 1 vers RegleCommission 0..*. */
    public function reglesCommission(): HasMany
    {
        return $this->hasMany(RegleCommission::class, 'administrateur_id');
    }

    public static function notifierTous(string $titre, string $contenu): void
    {
        self::query()->where('statut', StatutCompte::ACTIF)->each(fn (self $a) => $a->notifier($titre, $contenu));
    }

    /** Opération du diagramme : approuver publie, rejeter ou suspendre retire l'annonce. */
    public function modererAnnonce(Annonce $a, DecisionModeration $d): void
    {
        match ($d) {
            DecisionModeration::APPROUVER => $a->publier(),
            DecisionModeration::REJETER => $a->rejeter(),
            DecisionModeration::SUSPENDRE => $a->suspendre(),
        };
        $a->bien->proprietaire->notifier('Modération de votre annonce', '« '.$a->bien->titre.' » : '.$a->statut->libelle().'.');
    }

    /** Opération du diagramme, qui étend la modération : réservée aux annonces publiées d'un propriétaire vérifié. */
    public function attribuerBadge(Annonce $a): void
    {
        if ($a->statut !== StatutAnnonce::PUBLIEE || ! $a->bien->proprietaire->identite_verifiee) {
            throw new OperationRefusee('Le badge va à une annonce publiée dont le propriétaire a une identité vérifiée.');
        }
        $a->update(['badge_verifie' => true]);
    }

    /** Opération du diagramme : l'agent validé peut recevoir des mandats. */
    public function validerAgent(Agent $a, bool $accepte = true): void
    {
        $a->update([
            'statut_validation' => $accepte ? StatutValidation::VALIDE : StatutValidation::REFUSE,
            'valide_le' => $accepte ? now() : null,
        ]);
        $a->notifier('Validation de votre compte agent', $accepte ? 'Votre compte agent est validé.' : 'Votre demande de validation est refusée.');
    }

    /** Opération du diagramme : la pièce d'identité est contrôlée, les annonces du propriétaire peuvent recevoir le badge vérifié. */
    public function verifierIdentite(Proprietaire $p): void
    {
        if ($p->piece_identite_url === null) {
            throw new OperationRefusee("Ce propriétaire n'a pas envoyé de pièce d'identité.");
        }
        $p->update(['identite_verifiee' => true]);
        $p->notifier('Identité vérifiée', 'Votre identité est vérifiée : vos annonces peuvent recevoir le badge vérifié.');
    }

    /** Opération du diagramme, qui inclut « Verser les fonds ». */
    public function validerRetrait(Retrait $r): Retrait
    {
        return app(GestionRetraits::class)->valider($r, $this);
    }

    /** Opération du diagramme, qui inclut « Notifier les parties ». */
    public function traiterSignalement(Signalement $s, string $resolution): void
    {
        $s->administrateur()->associate($this);
        $s->resoudre($resolution);
        $texte = 'Votre signalement est traité : '.$resolution;
        $s->client->notifier('Signalement traité', $texte);
        $s->annonce?->bien->proprietaire->notifier('Signalement traité', 'Un signalement sur « '.$s->annonce->bien->titre.' » est traité : '.$resolution);
    }

    /** Opération du diagramme : le compte suspendu perd ses jetons et ne peut plus se connecter. */
    public function suspendreCompte(Compte $c): void
    {
        if ($c->is($this)) {
            throw new OperationRefusee('Vous ne pouvez pas suspendre votre propre compte.');
        }
        $c->update(['statut' => StatutCompte::SUSPENDU]);
        $c->tokens()->delete();
    }

    public function reactiverCompte(Compte $c): void
    {
        $c->update(['statut' => StatutCompte::ACTIF]);
    }

    /** Opération du diagramme, qui inclut « Envoyer SMS » quand le canal est SMS. */
    public function envoyerNotification(Compte $c, Notification $n): void
    {
        $n->compte()->associate($c);
        $n->save();
        $n->envoyer();
    }

    /** Indicateurs du cas « Consulter le tableau de bord » (page Administrateur). @return array<string, int> */
    public function indicateursAdministration(): array
    {
        return [
            'utilisateurs' => Compte::tous()->where('role', '!=', Role::ADMINISTRATEUR->value)->count(),
            'annonces_a_moderer' => Annonce::where('statut', StatutAnnonce::EN_MODERATION)->count(),
            'agents_a_valider' => Agent::where('statut_validation', StatutValidation::EN_ATTENTE)->count(),
            'signalements_ouverts' => Signalement::where('statut', StatutSignalement::OUVERT)->count(),
            'retraits_en_attente' => Retrait::where('statut', StatutRetrait::DEMANDE)->count(),
            'volume' => (int) Paiement::tous()->where('statut', StatutPaiement::REUSSI)->sum('montant'),
            'commissions' => (int) Paiement::tous()->where('statut', StatutPaiement::REUSSI)->sum('commission'),
        ];
    }
}
