<?php

namespace App\Contracts;

/** Interface ServiceStockage du diagramme : fichiers des Media et documents des contrats. */
interface ServiceStockage
{
    /** @return string l'adresse du fichier rangé */
    public function televerser(string $fichier, string $nom): string;

    public function supprimer(string $url): void;

    /** Adresse temporaire pour lire un fichier privé. */
    public function urlSignee(string $url, int $dureeMin): string;
}
