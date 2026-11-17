<?php

namespace App\Contracts;

/** Interface ServiceNotification du diagramme : les trois canaux de la classe Notification. */
interface ServiceNotification
{
    public function envoyerPush(string $jeton, string $titre, string $texte): void;

    public function envoyerSms(string $telephone, string $texte): void;

    public function envoyerEmail(string $email, string $sujet, string $corps): void;
}
