<?php

namespace App\Services\Signature;

use App\Contracts\ServiceSignature;
use App\Enums\StatutSignature;
use App\Exceptions\OperationRefusee;
use App\Models\Compte;
use App\Models\Signature;
use Illuminate\Support\Str;

/**
 * ServiceSignature tenu par la plateforme : signature électronique simple
 * (signataire authentifié, date et adresse IP consignées), au sens de la loi
 * sénégalaise n° 2008-08 sur les transactions électroniques.
 * Le document signé est le contrat régénéré avec le relevé des signatures.
 */
class SignatureElectroniqueSimple implements ServiceSignature
{
    private const PREFIXE = 'SIG-';

    private const LONGUEUR = 12;

    public function creerDemande(string $documentUrl, array $emails): string
    {
        if ($emails === []) {
            throw new OperationRefusee('Un contrat doit avoir au moins un signataire.');
        }

        return self::PREFIXE.Str::upper(Str::random(self::LONGUEUR));
    }

    public function statut(string $reference): StatutSignature
    {
        return $this->signature($reference)->statut;
    }

    public function documentSigne(string $reference): string
    {
        return $this->signature($reference)->contrat->genererDocument();
    }

    /** Le signataire authentifié appose sa signature depuis l'application. */
    public function signer(Signature $s, Compte $signataire, string $adresseIp): void
    {
        if ($s->signataire_id !== $signataire->id) {
            throw new OperationRefusee('Cette signature ne vous est pas demandée.', OperationRefusee::INTERDIT);
        }
        if ($s->statut !== StatutSignature::EN_ATTENTE) {
            throw new OperationRefusee('Vous avez déjà répondu à cette demande de signature.');
        }
        $s->update(['statut' => StatutSignature::SIGNEE, 'signe_le' => now(), 'adresse_ip' => $adresseIp]);
    }

    private function signature(string $reference): Signature
    {
        return Signature::where('reference_service', $reference)->first()
            ?? throw new OperationRefusee('Demande de signature introuvable.', OperationRefusee::INTROUVABLE);
    }
}
