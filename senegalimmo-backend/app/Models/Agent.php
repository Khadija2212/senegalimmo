<?php

namespace App\Models;

use App\Enums\Role;
use App\Enums\StatutValidation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/** Agent du diagramme : gère les biens confiés par mandat, validé par l'administrateur. */
class Agent extends Utilisateur
{
    use DetientPortefeuille;

    public const ROLE = 'agent';

    public function role(): Role
    {
        return Role::AGENT;
    }

    /** Attribut statutValidation du diagramme, tiré du parcours de vérification d'identité. */
    public function statutValidation(): StatutValidation
    {
        return match ($this->verification) {
            'verifie' => StatutValidation::VALIDE,
            'refuse' => StatutValidation::REFUSE,
            default => StatutValidation::EN_ATTENTE,
        };
    }

    /** Opération biensAssignes du diagramme : les biens sous mandat actif. @return Collection<int, int> */
    public function biensAssignes(): Collection
    {
        return $this->mandats()->where('statut', 'actif')->whereDate('date_fin', '>=', today())->pluck('bien_id');
    }

    private function mandats(): Builder
    {
        return Mandat::where(fn (Builder $q) => $q->where('agent_id', $this->id)->orWhere('agence_id', $this->id));
    }

    private function commissions(): Builder
    {
        return Commission::where(fn (Builder $q) => $q->where('agent_id', $this->id)->orWhere('agence_id', $this->id));
    }

    public function indicateursTableauDeBord(): array
    {
        $biens = $this->biensAssignes();

        return [
            'biens_assignes' => $biens->count(),
            'mandats_actifs' => $biens->count(),
            'mandats_en_attente' => $this->mandats()->where('statut', 'propose')->count(),
            'visites_en_attente' => Visite::where(fn (Builder $q) => $q->where('agent_id', $this->id)->orWhereIn('bien_id', $biens))
                ->where('statut', 'en_attente')->count(),
            'transactions' => $this->commissions()->count(),
            'commissions' => (float) $this->commissions()->sum('montant'),
            'commissions_dues' => (float) $this->commissions()->where('statut', 'due')->sum('montant'),
            'solde' => $this->soldeDisponible(),
        ];
    }
}
