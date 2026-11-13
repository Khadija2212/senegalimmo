<?php

namespace App\Services;

use App\Models\Commission;
use App\Models\Contrat;
use App\Models\Mandat;
use App\Models\PromesseVente;

class CommissionService
{
    private function mandatActif(int $bienId): ?Mandat
    {
        return Mandat::where('bien_id', $bienId)
            ->where('statut', 'actif')
            ->whereDate('date_fin', '>=', today())
            ->first();
    }

    // Location : taux × loyer mensuel × min(durée, 12 mois)
    public function pourBail(Contrat $contrat): void
    {
        $mandat = $this->mandatActif($contrat->bien_id);

        if (!$mandat || Commission::where('contrat_id', $contrat->id)->exists()) {
            return;
        }

        $base = (float) $contrat->loyer_mensuel * min((int) $contrat->duree_mois, 12);

        $this->creer($mandat, 'location', $base, ['contrat_id' => $contrat->id]);
    }

    // Vente : taux × prix convenu
    public function pourVente(PromesseVente $promesse): void
    {
        $mandat = $this->mandatActif($promesse->bien_id);

        if (!$mandat || Commission::where('promesse_id', $promesse->id)->exists()) {
            return;
        }

        $this->creer($mandat, 'vente', (float) $promesse->prix_convenu, ['promesse_id' => $promesse->id]);
    }

    private function creer(Mandat $mandat, string $type, float $base, array $reference): void
    {
        $taux = (float) $mandat->commission_pct;

        Commission::create($reference + [
            'mandat_id'       => $mandat->id,
            'bien_id'         => $mandat->bien_id,
            'agence_id'       => $mandat->agence_id,
            'agent_id'        => $mandat->agent_id,
            'proprietaire_id' => $mandat->proprietaire_id,
            'type'            => $type,
            'base'            => round($base, 2),
            'taux'            => $taux,
            'montant'         => round($base * $taux / 100, 2),
        ]);
    }
}