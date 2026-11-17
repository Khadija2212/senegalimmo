<?php

namespace App\Services\Notification;

use App\Contracts\ServiceNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * ServiceNotification : e-mail par le mailer Laravel, SMS par Orange, push par Firebase.
 * Un canal sans prestataire configuré (développement local) est consigné dans le journal.
 */
class NotificationMulticanal implements ServiceNotification
{
    public function __construct(private readonly ?SmsOrange $sms, private readonly ?PushFirebase $push) {}

    public function envoyerPush(string $jeton, string $titre, string $texte): void
    {
        $this->push === null
            ? Log::info('Notification push (aucun prestataire configuré)', ['sujet' => $jeton, 'titre' => $titre])
            : $this->push->envoyer($jeton, $titre, $texte);
    }

    public function envoyerSms(string $telephone, string $texte): void
    {
        $this->sms === null
            ? Log::info('SMS (aucun prestataire configuré)', ['longueur' => mb_strlen($texte)])
            : $this->sms->envoyer($telephone, $texte);
    }

    public function envoyerEmail(string $email, string $sujet, string $corps): void
    {
        Mail::raw($corps, fn ($message) => $message->to($email)->subject($sujet));
    }
}
