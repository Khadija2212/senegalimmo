<?php

namespace App\Models;

use App\Contracts\ServiceStockage;
use App\Services\DocumentPdf;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Recu du diagramme : atteste un Paiement réussi (composition « atteste »). */
class Recu extends Model
{
    use HasUuids;

    private const DOSSIER = 'recus';

    private const FORMAT = 'A5';

    private const DUREE_LIEN_MIN = 15;

    protected $table = 'recus';

    protected $fillable = ['numero', 'document_url', 'emis_le'];

    protected $casts = ['emis_le' => 'datetime'];

    public function paiementAtteste(): BelongsTo
    {
        return $this->belongsTo(PaiementLoyer::class, 'paiement_id')->withoutGlobalScope('heritage');
    }

    /** Opération du diagramme : produit le PDF une fois, le range, et renvoie une adresse de lecture. */
    public function telecharger(): string
    {
        $stockage = app(ServiceStockage::class);
        if ($this->document_url === null) {
            $paiement = $this->paiementAtteste;
            $vue = $paiement instanceof PaiementIndemnite ? 'pdf.recu_vente' : 'pdf.quittance';
            $pdf = DocumentPdf::rendre($vue, ['paiement' => $paiement, 'recu' => $this], self::FORMAT);
            $this->update(['document_url' => $stockage->televerser($pdf, self::DOSSIER.'/'.$this->numero.'.pdf')]);
        }

        return $stockage->urlSignee($this->document_url, self::DUREE_LIEN_MIN);
    }
}
