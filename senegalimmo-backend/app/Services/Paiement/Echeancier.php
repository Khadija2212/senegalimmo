<?php

namespace App\Services\Paiement;

use App\Enums\StatutPaiement;
use App\Models\Contrat;
use App\Models\PaiementCaution;
use App\Models\PaiementLoyer;
use Illuminate\Support\Carbon;

/** Les mois dus d'un bail et ce qui est déjà réglé. */
class Echeancier
{
    /** @return list<Carbon> premier jour de chaque mois couvert par le bail */
    public function mois(Contrat $bail): array
    {
        $mois = [];
        $debut = $bail->date_debut->copy()->startOfMonth();
        for ($i = 0; $i < (int) $bail->duree_mois; $i++) {
            $mois[] = $debut->copy()->addMonthsNoOverflow($i);
        }

        return $mois;
    }

    /** @return list<string> mois réglés, au format AAAA-MM */
    public function moisPayes(Contrat $bail): array
    {
        return PaiementLoyer::where('bail_id', $bail->id)
            ->where('statut', StatutPaiement::REUSSI)
            ->pluck('mois_concerne')
            ->map(fn ($d) => Carbon::parse($d)->format('Y-m'))
            ->all();
    }

    public function prochainMois(Contrat $bail): ?Carbon
    {
        $payes = $this->moisPayes($bail);

        foreach ($this->mois($bail) as $m) {
            if (!in_array($m->format('Y-m'), $payes, true)) {
                return $m;
            }
        }

        return null;
    }

    public function cautionPayee(Contrat $bail): bool
    {
        return PaiementCaution::where('bail_id', $bail->id)->where('statut', StatutPaiement::REUSSI)->exists();
    }

    /** @return array<string, mixed> */
    public function resume(Contrat $bail): array
    {
        return [
            'caution_montant' => (int) round((float) $bail->caution),
            'caution_payee' => $this->cautionPayee($bail),
            'loyer_montant' => (int) round((float) $bail->loyer_mensuel),
            'loyers_payes' => count($this->moisPayes($bail)),
            'loyers_total' => (int) $bail->duree_mois,
            'prochaine_periode' => $this->prochainMois($bail)?->format('Y-m'),
        ];
    }
}
