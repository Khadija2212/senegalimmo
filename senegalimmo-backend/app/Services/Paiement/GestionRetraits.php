<?php

namespace App\Services\Paiement;

use App\Models\Administrateur;
use App\Models\Compte;
use App\Contracts\PasserellePaiement;
use App\Enums\MethodePaiement;
use App\Enums\StatutRetrait;
use App\Exceptions\OperationRefusee;
use App\Exceptions\PasserelleIndisponible;
use App\Models\Portefeuille;
use App\Models\Retrait;
use Illuminate\Support\Facades\DB;

/**
 * Cas « Demander un retrait » (propriétaire, agent) et « Valider les retraits »
 * (administrateur), étendu par « Verser les fonds » via la passerelle.
 */
class GestionRetraits
{
    public function __construct(private readonly PasserellePaiement $passerelle, private readonly int $minimum)
    {
    }

    public function demander(Compte $u, int $montant, MethodePaiement $m, string $numero): Retrait
    {
        if ($m->serviceTransfert() === null) {
            throw new OperationRefusee('Un retrait se fait vers Wave, Orange Money ou Free Money.');
        }
        if ($montant < $this->minimum) {
            throw new OperationRefusee('Le montant minimum d\'un retrait est de ' . number_format($this->minimum, 0, ',', ' ') . ' FCFA.');
        }
        $portefeuille = Portefeuille::de($u);

        return DB::transaction(function () use ($portefeuille, $montant, $m, $numero): Retrait {
            $retrait = $portefeuille->retraits()->create([
                'montant' => $montant,
                'methode' => $m,
                'numero_beneficiaire' => $numero,
                'statut' => StatutRetrait::DEMANDE,
                'demande_le' => now(),
            ]);
            $portefeuille->bloquer($montant, $retrait);

            return $retrait;
        });
    }

    /**
     * Opération validerRetrait() de l'Administrateur : approuve puis demande le versement.
     * PayTech confirme ensuite par notification ; la passerelle simulée verse tout de suite.
     */
    public function valider(Retrait $retrait, Administrateur $administrateur): Retrait
    {
        $retrait->approuver($administrateur);

        try {
            $reference = $this->passerelle->transferer($retrait->numero_beneficiaire, $retrait->montant, $retrait->methode);
        } catch (PasserelleIndisponible $e) {
            $retrait->rejeter('Versement impossible : ' . $e->getMessage());

            return $retrait;
        }

        $retrait->update(['reference_paytech' => $reference]);
        if ($this->passerelle instanceof PasserelleSimulee) {
            $retrait->marquerVerse($reference);
        }

        return $retrait;
    }

    /** Notification de versement du prestataire (transfer_success ou transfer_failed). */
    public function suiteVersement(string $reference, bool $reussi): bool
    {
        $retrait = Retrait::where('reference_paytech', $reference)->first();
        if ($retrait === null) {
            return false;
        }
        if ($reussi) {
            $retrait->marquerVerse($reference);
        } elseif ($retrait->statut === StatutRetrait::APPROUVE) {
            $retrait->rejeter("Le versement a échoué chez l'opérateur.");
        }

        return true;
    }
}
