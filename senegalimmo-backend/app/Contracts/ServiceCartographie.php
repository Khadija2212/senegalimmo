<?php

namespace App\Contracts;

/** Interface ServiceCartographie du diagramme, utilisée par Bien. */
interface ServiceCartographie
{
    /** @return array{0: float, 1: float} latitude puis longitude */
    public function geocoder(string $adresse): array;

    public function adresseDe(float $lat, float $lng): string;
}
