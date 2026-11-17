<?php

namespace App\Models;

use App\Enums\MethodePaiement;
use App\Enums\MotifSignalement;
use App\Enums\Role;
use App\Enums\StatutContrat;
use App\Enums\StatutDemande;
use App\Enums\StatutOffre;
use App\Enums\TypeTransaction;
use App\Exceptions\OperationRefusee;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/** Client du diagramme : cherche, visite, loue ou achète, paie. */
class Client extends Utilisateur
{
    private const VALIDITE_OFFRE_JOURS = 7;

    public function role(): Role
    {
        return Role::CLIENT;
    }

    /** Association « favoris » : Client 0..* vers Annonce 0..*. */
    public function favoris(): BelongsToMany
    {
        return $this->belongsToMany(Annonce::class, 'favoris', 'client_id', 'annonce_id')->withTimestamps();
    }

    public function demandesLocation(): HasMany
    {
        return $this->hasMany(DemandeLocation::class, 'client_id');
    }

    public function offresAchat(): HasMany
    {
        return $this->hasMany(OffreAchat::class, 'client_id');
    }

    public function visites(): HasMany
    {
        return $this->hasMany(Visite::class, 'client_id');
    }

    public function signalements(): HasMany
    {
        return $this->hasMany(Signalement::class, 'client_id');
    }

    public function ajouterFavori(Annonce $a): void
    {
        $a->exigerOuverte();
        $this->favoris()->syncWithoutDetaching([$a->id]);
    }

    public function retirerFavori(Annonce $a): void
    {
        $this->favoris()->detach($a->id);
    }

    public function demanderLocation(Annonce $a, Carbon $entree, int $dureeMois, ?string $message = null): DemandeLocation
    {
        $a->exigerOuverte(TypeTransaction::LOCATION);
        if ($entree->lt(today())) {
            throw new OperationRefusee("La date d'entrée doit être aujourd'hui ou plus tard.");
        }
        if ($this->demandesLocation()->where('annonce_id', $a->id)->where('statut', StatutDemande::EN_ATTENTE)->exists()) {
            throw new OperationRefusee('Vous avez déjà une demande en attente pour cette annonce.');
        }
        $d = $this->demandesLocation()->create([
            'annonce_id' => $a->id, 'date_entree_souhaitee' => $entree, 'duree_mois' => $dureeMois, 'message' => $message,
        ]);
        $a->bien->notifierInterlocuteurs('Nouvelle demande de location', $this->nomComplet().' souhaite louer « '.$a->bien->titre.' ».');

        return $d;
    }

    public function demanderVisite(Annonce $a, Carbon $date): Visite
    {
        $a->exigerOuverte();
        if ($date->lte(now())) {
            throw new OperationRefusee('La visite doit être prévue dans le futur.');
        }
        $v = $this->visites()->create(['annonce_id' => $a->id, 'date_heure' => $date]);
        $a->bien->notifierInterlocuteurs('Nouvelle demande de visite',
            $this->nomComplet().' souhaite visiter « '.$a->bien->titre.' » le '.$date->format('d/m/Y à H\hi').'.');

        return $v;
    }

    public function soumettreOffre(Annonce $a, int $montant, ?string $message = null): OffreAchat
    {
        $a->exigerOuverte(TypeTransaction::VENTE);
        if ($this->offresAchat()->where('annonce_id', $a->id)->where('statut', StatutOffre::EN_ATTENTE)->exists()) {
            throw new OperationRefusee('Vous avez déjà une offre en attente pour cette annonce.');
        }
        $o = $this->offresAchat()->create([
            'annonce_id' => $a->id, 'montant' => $montant, 'message' => $message,
            'expire_le' => now()->addDays(self::VALIDITE_OFFRE_JOURS),
        ]);
        $a->bien->notifierInterlocuteurs("Nouvelle offre d'achat",
            $this->nomComplet().' propose '.Annonce::fcfa($montant).' pour « '.$a->bien->titre.' ».');

        return $o;
    }

    public function signalerProbleme(?Annonce $a, MotifSignalement $m, string $texte): Signalement
    {
        $s = $this->signalements()->create(['annonce_id' => $a?->id, 'motif' => $m, 'description' => $texte]);
        $a?->bien->notifierInterlocuteurs('Signalement sur votre annonce', 'Un problème a été signalé sur « '.$a->bien->titre.' ».');
        Administrateur::notifierTous('Nouveau signalement', $this->nomComplet().' signale : '.$texte);

        return $s;
    }

    /**
     * Opération du diagramme : seul le payeur du paiement l'ouvre chez la passerelle.
     *
     * @return string URL de la page de paiement
     */
    public function payer(Paiement $p, MethodePaiement $m): string
    {
        if (! $p->payeur()?->is($this)) {
            throw new OperationRefusee('Ce paiement ne vous concerne pas.', OperationRefusee::INTERDIT);
        }
        $p->update(['methode' => $m]);

        return $p->initier();
    }

    /** Les baux où ce client est locataire. */
    public function baux(): Builder
    {
        return Bail::query()->whereHas('demandeLocation', fn ($q) => $q->where('client_id', $this->id));
    }

    /** Les promesses de vente où ce client est acheteur. */
    public function promesses(): Builder
    {
        return PromesseVente::query()->whereHas('offreAchat', fn ($q) => $q->where('client_id', $this->id));
    }

    public function indicateursTableauDeBord(): array
    {
        return [
            'favoris' => $this->favoris()->count(),
            'demandes_location' => $this->demandesLocation()->count(),
            'visites' => $this->visites()->count(),
            'offres_en_cours' => $this->offresAchat()->where('statut', StatutOffre::EN_ATTENTE)->count(),
            'baux_signes' => $this->baux()->where('statut', StatutContrat::SIGNE)->count(),
            'promesses_signees' => $this->promesses()->where('statut', StatutContrat::SIGNE)->count(),
            'messages_non_lus' => $this->messagesNonLus(),
        ];
    }
}
