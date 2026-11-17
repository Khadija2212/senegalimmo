<?php

namespace App\Contracts;

use App\Enums\StatutSignature;

/** Interface ServiceSignature du diagramme, utilisée par Signature. */
interface ServiceSignature
{
    /**
     * @param  list<string>  $emails  les signataires, dans l'ordre
     * @return string la référence de la demande chez le service
     */
    public function creerDemande(string $documentUrl, array $emails): string;

    public function statut(string $reference): StatutSignature;

    /** @return string l'adresse du document signé */
    public function documentSigne(string $reference): string;
}
