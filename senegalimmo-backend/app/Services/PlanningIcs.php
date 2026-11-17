<?php

namespace App\Services;

use App\Models\Visite;
use Illuminate\Support\Collection;

/** Planning de visites au format iCalendar (RFC 5545), importable dans un agenda. */
class PlanningIcs
{
    private const DUREE_VISITE_MIN = 45;

    private const FORMAT = 'Ymd\THis\Z';

    /** @param Collection<int, Visite> $visites */
    public function generer(Collection $visites): string
    {
        $lignes = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SenegalImmo//Planning//FR', 'CALSCALE:GREGORIAN'];
        foreach ($visites as $v) {
            $debut = $v->date_heure->copy()->utc();
            $lignes = array_merge($lignes, [
                'BEGIN:VEVENT',
                'UID:'.$v->id.'@senegalimmo',
                'DTSTAMP:'.now()->utc()->format(self::FORMAT),
                'DTSTART:'.$debut->format(self::FORMAT),
                'DTEND:'.$debut->copy()->addMinutes(self::DUREE_VISITE_MIN)->format(self::FORMAT),
                'SUMMARY:'.$this->echapper('Visite : '.$v->annonce->bien->titre),
                'LOCATION:'.$this->echapper($v->annonce->bien->adresseComplete()),
                'DESCRIPTION:'.$this->echapper('Client : '.$v->client->nomComplet().', '.$v->client->telephone),
                'END:VEVENT',
            ]);
        }
        $lignes[] = 'END:VCALENDAR';

        return implode("\r\n", $lignes)."\r\n";
    }

    private function echapper(string $texte): string
    {
        return str_replace(['\\', ';', ',', "\n"], ['\\\\', '\;', '\,', '\n'], $texte);
    }
}
