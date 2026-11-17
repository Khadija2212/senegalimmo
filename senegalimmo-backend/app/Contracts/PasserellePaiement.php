<?php

namespace App\Contracts;

use App\Enums\MethodePaiement;
use App\Exceptions\PasserelleIndisponible;

/**
 * Interface «interface» PasserellePaiement du diagramme de classes.
 * Paiement et Retrait en dépendent («use») sans connaître le prestataire (PayTech).
 */
interface PasserellePaiement
{
    /**
     * Ouvre un paiement chez le prestataire.
     *
     * @return string URL de la page de paiement, qui se termine par la référence du prestataire
     *
     * @throws PasserelleIndisponible
     */
    public function demanderPaiement(string $ref, int $montant, MethodePaiement $m): string;

    /**
     * Vérifie qu'une notification vient bien du prestataire.
     *
     * @param  string  $signature  signature jointe à la notification (vide si absente)
     * @param  string  $corps  corps brut de la requête reçue
     */
    public function verifierNotification(string $signature, string $corps): bool;

    /**
     * Verse de l'argent sur un compte mobile.
     *
     * @return string référence du versement chez le prestataire
     *
     * @throws PasserelleIndisponible
     */
    public function transferer(string $numero, int $montant, MethodePaiement $m): string;
}
