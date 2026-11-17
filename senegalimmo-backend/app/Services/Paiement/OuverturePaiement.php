<?php

namespace App\Services\Paiement;

use App\Enums\MethodePaiement;
use App\Enums\StatutContrat;
use App\Enums\StatutPaiement;
use App\Enums\TypeTransaction;
use App\Exceptions\OperationRefusee;
use App\Models\Bail;
use App\Models\Client;
use App\Models\Paiement;
use App\Models\PaiementCaution;
use App\Models\PaiementIndemnite;
use App\Models\PaiementLoyer;
use App\Models\PromesseVente;
use App\Models\RegleCommission;

/**
 * Crée le bon Paiement selon les règles du cas « Effectuer un paiement » et de ses
 * trois spécialisations : payer le loyer, la caution, l'indemnité d'immobilisation.
 */
class OuverturePaiement
{
    public function loyer(Bail $bail, Client $client, MethodePaiement $m): PaiementLoyer
    {
        $this->verifierContrat($bail, $client);
        $mois = $bail->prochainMoisDu() ?? throw new OperationRefusee('Tous les loyers de ce bail sont payés.');

        return $this->creer(new PaiementLoyer, $bail->loyer_mensuel + $bail->charges, $m, TypeTransaction::LOCATION, [
            'bail_id' => $bail->id,
            'mois_concerne' => $mois,
        ]);
    }

    public function caution(Bail $bail, Client $client, MethodePaiement $m): PaiementCaution
    {
        $this->verifierContrat($bail, $client);
        if ($bail->paiementCaution()->exists()) {
            throw new OperationRefusee('La caution est déjà payée.');
        }

        return $this->creer(new PaiementCaution, $bail->caution, $m, TypeTransaction::LOCATION, ['bail_id' => $bail->id]);
    }

    public function indemnite(PromesseVente $promesse, Client $client, MethodePaiement $m): PaiementIndemnite
    {
        $this->verifierContrat($promesse, $client);
        if ($promesse->paiementIndemnite()->where('statut', StatutPaiement::REUSSI)->exists()) {
            throw new OperationRefusee("L'indemnité d'immobilisation est déjà payée.");
        }

        return $this->creer(new PaiementIndemnite, $promesse->indemnite_immobilisation, $m, TypeTransaction::VENTE, [
            'promesse_id' => $promesse->id,
        ]);
    }

    private function verifierContrat(Bail|PromesseVente $contrat, Client $client): void
    {
        $payeur = $contrat instanceof Bail ? $contrat->locataire() : $contrat->acheteur();
        if (! $payeur->is($client)) {
            throw new OperationRefusee('Ce contrat ne vous concerne pas.', OperationRefusee::INTERDIT);
        }
        if ($contrat->statut !== StatutContrat::SIGNE) {
            throw new OperationRefusee("Le contrat doit d'abord être signé par les deux parties.");
        }
    }

    /**
     * @template T of Paiement
     *
     * @param  T  $paiement
     * @param  array<string, mixed>  $cible
     * @return T
     */
    private function creer(Paiement $paiement, int $montant, MethodePaiement $m, TypeTransaction $tx, array $cible): Paiement
    {
        if ($montant <= 0) {
            throw new OperationRefusee('Le montant à payer est nul.');
        }
        $regle = RegleCommission::enVigueur($tx);

        $paiement->fill($cible + [
            'reference' => Paiement::nouvelleReference(),
            'montant' => $montant,
            'commission' => $regle->calculer($montant),
            'methode' => $m,
            'statut' => StatutPaiement::EN_ATTENTE,
            'regle_commission_id' => $regle->id,
        ])->save();

        return $paiement;
    }
}
