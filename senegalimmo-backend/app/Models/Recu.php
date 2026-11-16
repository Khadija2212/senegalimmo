<?php

namespace App\Models;

use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

/** Recu du diagramme : atteste un Paiement réussi (composition). */
class Recu extends Model
{
    private const DOSSIER = 'recus';
    private const FORMAT = 'A5';

    protected $table = 'recus';

    protected $fillable = ['numero', 'document_url', 'emis_le'];

    protected $casts = ['emis_le' => 'datetime'];

    /** Le paiement attesté, chargé dans sa sous-classe. */
    public function paiement(): Paiement
    {
        return Paiement::tous()->findOrFail($this->paiement_id);
    }

    /**
     * Produit le PDF une fois, le range dans le stockage privé et renvoie son chemin.
     */
    public function telecharger(): string
    {
        if ($this->document_url && Storage::disk('local')->exists($this->document_url)) {
            return $this->document_url;
        }

        $paiement = $this->paiement();
        $options = new Options();
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', false);

        $pdf = new Dompdf($options);
        $pdf->loadHtml(view(self::vue($paiement), ['paiement' => $paiement, 'recu' => $this])->render());
        $pdf->setPaper(self::FORMAT, 'portrait');
        $pdf->render();

        $chemin = self::DOSSIER . '/' . $this->numero . '.pdf';
        Storage::disk('local')->put($chemin, (string) $pdf->output());
        $this->update(['document_url' => $chemin]);

        return $chemin;
    }

    private static function vue(Paiement $paiement): string
    {
        return $paiement instanceof PaiementIndemnite ? 'pdf.recu_vente' : 'pdf.quittance';
    }
}
