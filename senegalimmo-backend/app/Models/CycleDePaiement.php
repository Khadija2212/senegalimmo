<?php

namespace App\Models;

use App\Contracts\PasserellePaiement;
use App\Enums\StatutPaiement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Opérations initier(), confirmer() et echouer() de la classe Paiement du diagramme.
 *
 * @mixin Paiement
 */
trait CycleDePaiement
{
    private static string $prefixeReference = 'SI-P-';

    private static int $longueurAleatoire = 6;

    public static function nouvelleReference(): string
    {
        return self::$prefixeReference.now()->format('ymd').'-'.Str::upper(Str::random(self::$longueurAleatoire));
    }

    /**
     * Opération du diagramme : ouvre le paiement chez la passerelle («use» PasserellePaiement).
     *
     * @return string URL de la page de paiement
     */
    public function initier(): string
    {
        $url = app(PasserellePaiement::class)->demanderPaiement($this->reference, $this->montant, $this->methode);
        $this->update(['reference_paytech' => basename((string) parse_url($url, PHP_URL_PATH))]);

        return $url;
    }

    /**
     * Confirme une seule fois, même si la notification arrive plusieurs fois :
     * statut REUSSI, reçu émis, bénéficiaire crédité du montant net.
     */
    public function confirmer(string $referencePaytech): void
    {
        DB::transaction(function () use ($referencePaytech): void {
            /** @var Paiement $p */
            $p = Paiement::tous()->lockForUpdate()->findOrFail($this->getKey());
            if (! in_array($p->statut, [StatutPaiement::EN_ATTENTE, StatutPaiement::ECHOUE], true)) {
                return;
            }

            $p->update([
                'statut' => StatutPaiement::REUSSI,
                'reference_paytech' => $referencePaytech !== '' ? $referencePaytech : $p->reference_paytech,
                'confirme_le' => now(),
            ]);
            $p->recu()->create(['numero' => 'R-'.$p->reference, 'emis_le' => now()]);

            $beneficiaire = $p->beneficiaire();
            if ($beneficiaire !== null && $p->montantNet() > 0) {
                Portefeuille::de($beneficiaire)->crediter($p->montantNet(), $p);
                $p->verserCommissionAgent($beneficiaire);
            }
            $this->setRawAttributes($p->getAttributes(), true);
        });
        $this->beneficiaire()?->notifier('Paiement reçu', $this->libelle().' : '.Annonce::fcfa($this->montantNet()).' crédités sur votre portefeuille.');
        $this->payeur()?->notifier('Paiement confirmé', $this->libelle().' : votre reçu '.$this->recu?->numero.' est disponible.');
    }

    /**
     * Quand le bien est confié à un agent par un mandat actif, sa commission passe
     * du portefeuille du propriétaire au sien (écritures COMMISSION_AGENT). La caution n'y donne pas lieu.
     */
    private function verserCommissionAgent(Proprietaire $proprietaire): void
    {
        $mandat = $this instanceof PaiementCaution ? null : $this->bien()?->mandatActif();
        $commission = $mandat?->commissionSur($this->montantNet()) ?? 0;
        if ($commission > 0) {
            Portefeuille::de($proprietaire)->verserCommission(Portefeuille::de($mandat->agent), $commission, $this->libelle().' ('.$this->reference.')');
        }
    }

    public function echouer(string $raison): void
    {
        if ($this->statut !== StatutPaiement::EN_ATTENTE) {
            return;
        }
        $this->update(['statut' => StatutPaiement::ECHOUE]);
        Log::info('Paiement échoué', ['reference' => $this->reference, 'raison' => $raison]);
    }
}
