<?php

namespace App\Models;

use App\Enums\NiveauInteret;
use App\Enums\Role;
use App\Enums\StatutBien;
use App\Enums\StatutContrat;
use App\Enums\StatutValidation;
use App\Enums\StatutVisite;
use App\Exceptions\OperationRefusee;
use App\Services\PlanningIcs;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/** Agent du diagramme : gère les biens confiés par mandat, validé par l'administrateur. */
class Agent extends Utilisateur
{
    use DetientPortefeuille;

    private const DECIMALES_TAUX = 2;

    protected $attributes = ['statut_validation' => 'en_attente'];

    protected function casts(): array
    {
        return ['statut_validation' => StatutValidation::class];
    }

    public function role(): Role
    {
        return Role::AGENT;
    }

    /** Association « mandataire » : Mandat 0..* vers Agent 1. */
    public function mandats(): HasMany
    {
        return $this->hasMany(Mandat::class, 'agent_id');
    }

    /** Requête des biens sous mandat actif confié à cet agent. */
    public function requeteBiensAssignes(): Builder
    {
        return Bien::query()->whereHas('mandats', fn (Builder $q) => $q->actifs()->where('agent_id', $this->id));
    }

    /** Opération du diagramme, étendue par « Filtrer par statut ». @return Collection<int, Bien> */
    public function biensAssignes(?StatutBien $s = null): Collection
    {
        return $this->requeteBiensAssignes()->when($s, fn (Builder $q) => $q->where('statut', $s))->get();
    }

    public function gere(Bien $b): bool
    {
        return $this->requeteBiensAssignes()->whereKey($b->id)->exists();
    }

    /** Visites des annonces de ses biens assignés. */
    public function visitesGerees(): Builder
    {
        return Visite::query()->whereHas('annonce', fn (Builder $q) => $q->whereIn('bien_id', $this->requeteBiensAssignes()->select('biens.id')));
    }

    /** Opération du diagramme : la visite passée devient effectuée, avec son compte rendu. */
    public function creerCompteRendu(Visite $v, string $contenu, NiveauInteret $interet): CompteRendu
    {
        if (! $this->gere($v->annonce->bien)) {
            throw new OperationRefusee("Cette visite ne porte pas sur l'un de vos biens.", OperationRefusee::INTERDIT);
        }
        $v->marquerEffectuee();

        return $v->compteRendu()->create(['contenu' => $contenu, 'interet_client' => $interet, 'redige_le' => now()]);
    }

    /** Opération du diagramme : les visites confirmées de la période, au format iCalendar. */
    public function exporterPlanning(Carbon $debut, Carbon $fin): string
    {
        $visites = $this->visitesGerees()->with('annonce.bien', 'client')
            ->where('statut', StatutVisite::CONFIRMEE)
            ->whereBetween('date_heure', [$debut->copy()->startOfDay(), $fin->copy()->endOfDay()])
            ->orderBy('date_heure')->get();

        return (new PlanningIcs)->generer($visites);
    }

    /**
     * Opération du diagramme : part des visites effectuées sur ses biens
     * qui ont abouti à un contrat signé (bail ou promesse de vente) pour le même client.
     */
    public function tauxConversion(): float
    {
        $effectuees = $this->visitesGerees()->where('statut', StatutVisite::EFFECTUEE)->get();
        if ($effectuees->isEmpty()) {
            return 0.0;
        }
        $converties = $effectuees->filter(fn (Visite $v): bool => $v->aAbouti())->count();

        return round($converties / $effectuees->count(), self::DECIMALES_TAUX);
    }

    public function indicateursTableauDeBord(): array
    {
        return [
            'biens_assignes' => $this->requeteBiensAssignes()->count(),
            'mandats_en_signature' => $this->mandats()->where('statut', StatutContrat::EN_SIGNATURE)->count(),
            'visites_a_confirmer' => $this->visitesGerees()->where('statut', StatutVisite::DEMANDEE)->count(),
            'visites_confirmees' => $this->visitesGerees()->where('statut', StatutVisite::CONFIRMEE)->count(),
            'taux_conversion' => $this->tauxConversion(),
            'messages_non_lus' => $this->messagesNonLus(),
            'solde' => $this->soldeDisponible(),
        ];
    }
}
