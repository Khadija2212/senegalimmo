<?php

namespace App\Services\Paiement;

use App\Enums\MethodePaiement;
use App\Enums\StatutPaiement;
use App\Enums\TypeTransaction;
use App\Exceptions\OperationRefusee;
use App\Models\Contrat;
use App\Models\Paiement;
use App\Models\PaiementCaution;
use App\Models\PaiementIndemnite;
use App\Models\PaiementLoyer;
use App\Models\PromesseVente;
use App\Models\RegleCommission;
use App\Models\User;

/**
 * Crée le bon Paiement en vérifiant les règles du cas « Effectuer un paiement »
 * et de ses deux spécialisations (payer le loyer, payer l'indemnité), plus la caution.
 */
class OuverturePaiement
{
    private const BAIL_SIGNE = 'signe';

    public function __construct(private readonly Echeancier $echeancier)
    {
    }

    public function loyer(Contrat $bail, User $client, MethodePaiement $m): PaiementLoyer
    {
        $this->verifierBail($bail, $client);
        $mois = $this->echeancier->prochainMois($bail);
        if ($mois === null) {
            throw new OperationRefusee('Tous les loyers de ce bail sont payés.');
        }

        return $this->creer(new PaiementLoyer(), (int) round((float) $bail->loyer_mensuel), $m, TypeTransaction::LOCATION, [
            'bail_id' => $bail->id,
            'mois_concerne' => $mois,
        ]);
    }

    public function caution(Contrat $bail, User $client, MethodePaiement $m): PaiementCaution
    {
        $this->verifierBail($bail, $client);
        if ($this->echeancier->cautionPayee($bail)) {
            throw new OperationRefusee('La caution est déjà payée.');
        }

        return $this->creer(new PaiementCaution(), (int) round((float) $bail->caution), $m, TypeTransaction::LOCATION, [
            'bail_id' => $bail->id,
        ]);
    }

    public function indemnite(PromesseVente $promesse, User $client, MethodePaiement $m): PaiementIndemnite
    {
        if ($promesse->acheteur_id !== $client->id) {
            throw new OperationRefusee('Cette promesse de vente ne vous concerne pas.', OperationRefusee::INTERDIT);
        }
        $dejaPayee = PaiementIndemnite::where('promesse_id', $promesse->id)
            ->where('statut', StatutPaiement::REUSSI)->exists();
        if ($dejaPayee) {
            throw new OperationRefusee("L'indemnité d'immobilisation est déjà payée.");
        }

        return $this->creer(new PaiementIndemnite(), (int) round((float) $promesse->indemnite_immobilisation), $m, TypeTransaction::VENTE, [
            'promesse_id' => $promesse->id,
            'restituable' => true,
        ]);
    }

    private function verifierBail(Contrat $bail, User $client): void
    {
        if ($bail->locataire_id !== $client->id) {
            throw new OperationRefusee('Ce bail ne vous concerne pas.', OperationRefusee::INTERDIT);
        }
        if ($bail->statut !== self::BAIL_SIGNE) {
            throw new OperationRefusee("Le bail doit d'abord être signé par les deux parties.");
        }
    }

    /**
     * @template T of Paiement
     *
     * @param T $paiement
     * @param array<string, mixed> $cible
     *
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
            'frais_service' => 0,
            'commission' => $regle->calculer($montant),
            'methode' => $m,
            'statut' => StatutPaiement::EN_ATTENTE,
            'regle_commission_id' => $regle->id,
        ])->save();

        return $paiement;
    }
}
