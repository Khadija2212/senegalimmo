<?php

namespace App\Services;

use Dompdf\Dompdf;
use Dompdf\Options;

/** Rend une vue Blade en PDF (contrats, reçus). */
class DocumentPdf
{
    private const POLICE = 'DejaVu Sans';

    /** @param array<string, mixed> $donnees */
    public static function rendre(string $vue, array $donnees, string $format = 'A4'): string
    {
        $options = new Options;
        $options->set('defaultFont', self::POLICE);
        $options->set('isRemoteEnabled', false);

        $pdf = new Dompdf($options);
        $pdf->loadHtml(view($vue, $donnees)->render());
        $pdf->setPaper($format, 'portrait');
        $pdf->render();

        return (string) $pdf->output();
    }
}
