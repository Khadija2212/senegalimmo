<?php

namespace App\Models;

use App\Enums\Role;
use App\Enums\StatutAnnonce;
use App\Enums\StatutContrat;
use App\Enums\StatutDemande;
use App\Enums\StatutOffre;
use App\Enums\StatutValidation;
use App\Enums\StatutVisite;
use App\Enums\TypeEtatDesLieux;
use App\Enums\TypeMandat;
use App\Enums\TypeTransaction;
use App\Exceptions\OperationRefusee;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/** Proprietaire du diagramme : possède des biens, publie, crée les baux, détient un portefeuille. */
class Proprietaire extends Utilisateur
{
    use DetientPortefeuille;

    private const JOUR_ECHEANCE_PAR_DEFAUT = 5;

    public function role(): Role
    {
        return Role::PROPRIETAIRE;
    }

    /** Association « possède » : Proprietaire 1 vers Bien 0..*. */
    public function biens(): HasMany
    {
        return $this->hasMany(Bien::class, 'proprietaire_id');
    }

    public function possede(Bien $b): bool
    {
        return $b->proprietaire_id === $this->id;
    }

    public function exigerPossede(Bien $b): void
    {
        if (! $this->possede($b)) {
            throw new OperationRefusee('Ce bien ne vous appartient pas.', OperationRefusee::INTERDIT);
        }
    }

    /** Opération du diagramme, qui inclut « Géolocaliser le bien ». */
    public function enregistrerBien(Bien $b): void
    {
        $b->proprietaire()->associate($this);
        $b->save();
        $b->geolocaliser();
    }

    /** Opération du diagramme : l'annonce part en modération avant d'être visible. */
    public function publierAnnonce(Bien $b, TypeTransaction $t, int $prix, int $charges = 0, int $caution = 0): Annonce
    {
        $this->exigerPossede($b);
        if ($b->annonces()->whereIn('statut', StatutAnnonce::enCours())->exists()) {
            throw new OperationRefusee('Ce bien a déjà une annonce en cours.');
        }
        $a = $b->annonces()->create([
            'reference' => Annonce::nouvelleReference(), 'type_transaction' => $t,
            'prix' => $prix, 'charges' => $charges, 'caution' => $caution,
        ]);
        Administrateur::notifierTous('Annonce à modérer', '« '.$b->titre.' » attend votre validation.');

        return $a;
    }

    /** Opération du diagramme, qui inclut « Signer le contrat » : le mandat part en signature. */
    public function mandaterAgent(Agent $a, Bien $b, TypeMandat $t, float $taux, Carbon $debut, Carbon $fin): Mandat
    {
        $this->exigerPossede($b);
        if ($a->statut_validation !== StatutValidation::VALIDE) {
            throw new OperationRefusee("Cet agent n'est pas encore validé par l'administration.");
        }
        if ($b->mandatActif() !== null) {
            throw new OperationRefusee('Ce bien est déjà confié à un agent.');
        }
        $m = Mandat::create([
            'bien_id' => $b->id, 'agent_id' => $a->id, 'type' => $t, 'taux_commission' => $taux,
            'date_debut' => $debut, 'date_fin' => $fin,
        ]);
        $m->envoyerEnSignature();

        return $m;
    }

    /** Opération du diagramme, qui inclut « Notifier locataire » : le bail reprend l'annonce et la demande. */
    public function creerBail(DemandeLocation $d, int $jourEcheance = self::JOUR_ECHEANCE_PAR_DEFAUT): Bail
    {
        $annonce = $d->annonce;
        $this->exigerPossede($annonce->bien);
        if ($d->statut !== StatutDemande::ACCEPTEE) {
            throw new OperationRefusee("La demande doit d'abord être acceptée.");
        }
        if ($d->bail()->exists()) {
            throw new OperationRefusee('Un bail existe déjà pour cette demande.');
        }
        $bail = Bail::create([
            'demande_location_id' => $d->id, 'loyer_mensuel' => $annonce->prix, 'charges' => $annonce->charges,
            'caution' => $annonce->caution, 'date_debut' => $d->date_entree_souhaitee, 'duree_mois' => $d->duree_mois,
            'jour_echeance' => $jourEcheance,
        ]);
        $bail->envoyerEnSignature();
        $d->client->notifier('Votre bail est prêt', 'Le bail de « '.$annonce->bien->titre.' » attend votre signature.');

        return $bail;
    }

    /** Opération du diagramme, qui inclut « Téléverser des photos ». @param list<string> $medias */
    public function realiserEtatDesLieux(Bail $b, TypeEtatDesLieux $t, ?string $observations, ?string $releve, array $medias = []): EtatDesLieux
    {
        $this->exigerPossede($b->bienConcerne());
        if ($b->statut !== StatutContrat::SIGNE) {
            throw new OperationRefusee("L'état des lieux se fait sur un bail signé.");
        }
        if ($b->etatsDesLieux()->where('type', $t)->exists()) {
            throw new OperationRefusee("L'état des lieux de ce type existe déjà.");
        }
        $e = $b->etatsDesLieux()->create(['type' => $t, 'date' => now(), 'observations' => $observations, 'releve_compteurs' => $releve]);
        $e->photos()->sync($b->bienConcerne()->medias()->whereIn('id', $medias)->pluck('id'));
        $b->locataire()->notifier('État des lieux à valider', "L'état des lieux d'".$t->value.' de votre logement est prêt.');

        return $e;
    }

    public function indicateursTableauDeBord(): array
    {
        $annonces = Annonce::whereIn('bien_id', $this->biens()->select('id'));

        return [
            'biens' => $this->biens()->count(),
            'annonces_publiees' => (clone $annonces)->where('statut', StatutAnnonce::PUBLIEE)->count(),
            'annonces_en_moderation' => (clone $annonces)->where('statut', StatutAnnonce::EN_MODERATION)->count(),
            'demandes_en_attente' => DemandeLocation::whereIn('annonce_id', (clone $annonces)->select('id'))->where('statut', StatutDemande::EN_ATTENTE)->count(),
            'visites_a_confirmer' => Visite::whereIn('annonce_id', (clone $annonces)->select('id'))->where('statut', StatutVisite::DEMANDEE)->count(),
            'offres_en_attente' => OffreAchat::whereIn('annonce_id', (clone $annonces)->select('id'))->where('statut', StatutOffre::EN_ATTENTE)->count(),
            'messages_non_lus' => $this->messagesNonLus(),
            'solde' => $this->soldeDisponible(),
        ];
    }
}
