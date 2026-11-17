<?php

namespace App\Services\Paiement;

use App\Contracts\PasserellePaiement;
use App\Enums\MethodePaiement;
use Illuminate\Support\Str;

/**
 * Seconde implémentation de PasserellePaiement, pour le développement local
 * sans clés PayTech ni URL HTTPS publique. Elle signe ses notifications comme
 * PayTech (HMAC) avec un secret local : le code métier ne voit pas la différence.
 */
class PasserelleSimulee implements PasserellePaiement
{
    public const CLE = 'simulation';

    private const PREFIXE_REFERENCE = 'SIM-';

    private const LONGUEUR_REFERENCE = 16;

    public function __construct(private readonly string $secret, private readonly string $urlApi) {}

    public function demanderPaiement(string $ref, int $montant, MethodePaiement $m): string
    {
        $jeton = self::PREFIXE_REFERENCE.Str::lower(Str::random(self::LONGUEUR_REFERENCE));

        return rtrim($this->urlApi, '/').'/api/paiements/simulation/'.urlencode($ref).'/'.$jeton;
    }

    public function verifierNotification(string $signature, string $corps): bool
    {
        $donnees = PayTechPasserelle::lireCorps($corps);
        if ($signature === '' || ! isset($donnees['item_price'], $donnees['ref_command'])) {
            return false;
        }

        return hash_equals($this->signer((int) $donnees['item_price'], (string) $donnees['ref_command']), $signature);
    }

    public function transferer(string $numero, int $montant, MethodePaiement $m): string
    {
        return self::PREFIXE_REFERENCE.'VERSEMENT-'.Str::upper(Str::random(self::LONGUEUR_REFERENCE));
    }

    public function signer(int $montant, string $ref): string
    {
        return hash_hmac('sha256', $montant.'|'.$ref.'|'.self::CLE, $this->secret);
    }
}
