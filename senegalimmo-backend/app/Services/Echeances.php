<?php

namespace App\Services;

use App\Enums\StatutContrat;
use App\Enums\StatutOffre;
use App\Models\Mandat;
use App\Models\OffreAchat;
use App\Models\PromesseVente;

/** Passage quotidien aux statuts d'expiration : mandats, offres d'achat, promesses de vente. */
class Echeances
{
    /** @return array<string, int> nombre de lignes passées à expirée, par classe */
    public function expirer(): array
    {
        $mandats = Mandat::where('statut', StatutContrat::SIGNE)->whereDate('date_fin', '<', today())->update(['statut' => StatutContrat::EXPIRE]);
        $offres = OffreAchat::where('statut', StatutOffre::EN_ATTENTE)->where('expire_le', '<', now())->update(['statut' => StatutOffre::EXPIREE]);
        $promesses = 0;
        PromesseVente::where('statut', StatutContrat::EN_SIGNATURE)->get()
            ->filter(fn (PromesseVente $p): bool => $p->estExpiree())
            ->each(function (PromesseVente $p) use (&$promesses): void {
                $p->update(['statut' => StatutContrat::EXPIRE]);
                $promesses++;
            });

        return ['mandats' => $mandats, 'offres' => $offres, 'promesses' => $promesses];
    }
}
