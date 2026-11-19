<?php

namespace App\Models;

use App\Enums\StatutBien;
use App\Enums\StatutOffre;
use App\Models\Concerns\ExigeStatut;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;

/** OffreAchat du diagramme : soumise par un Client, porte sur une Annonce, concrétisée par une PromesseVente. */
class OffreAchat extends Model
{
    use ExigeStatut, HasUuids;

    /** Part du prix convenu versée comme indemnité d'immobilisation. */
    private const TAUX_INDEMNITE = 0.10;

    private const DELAI_ACTE_JOURS = 90;

    protected $table = 'offres_achat';

    protected $fillable = ['annonce_id', 'montant', 'message', 'statut', 'motif_refus', 'expire_le'];

    protected $attributes = ['statut' => 'en_attente'];

    protected $casts = ['montant' => 'integer', 'statut' => StatutOffre::class, 'expire_le' => 'datetime'];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function annonce(): BelongsTo
    {
        return $this->belongsTo(Annonce::class);
    }

    /** Association « concrétise » : PromesseVente 0..1 vers OffreAchat 1. */
    public function promesseVente(): HasOne
    {
        return $this->hasOne(PromesseVente::class, 'offre_achat_id');
    }

    /**
     * Accepter une offre met le bien sous offre, écarte les autres offres en attente
     * et crée la promesse de vente, envoyée en signature.
     */
    public function accepter(): PromesseVente
    {
        $this->exigerEnAttente();

        $promesse = DB::transaction(function (): PromesseVente {
            $this->update(['statut' => StatutOffre::ACCEPTEE]);
            self::where('annonce_id', $this->annonce_id)->whereKeyNot($this->id)->where('statut', StatutOffre::EN_ATTENTE)
                ->update(['statut' => StatutOffre::REFUSEE]);
            $this->annonce->bien->update(['statut' => StatutBien::SOUS_OFFRE]);

            return PromesseVente::create([
                'offre_achat_id' => $this->id, 'prix_vente' => $this->montant,
                'indemnite_immobilisation' => (int) round($this->montant * self::TAUX_INDEMNITE),
                'date_limite_acte' => today()->addDays(self::DELAI_ACTE_JOURS), 'date_debut' => today(),
            ]);
        });
        $promesse->envoyerEnSignature();
        $this->client->notifier("Offre d'achat acceptée", 'Votre offre de '.Annonce::fcfa($this->montant).' est acceptée. La promesse de vente attend votre signature.');

        return $promesse;
    }

    public function refuser(string $motif): void
    {
        $this->exigerEnAttente();
        $this->update(['statut' => StatutOffre::REFUSEE, 'motif_refus' => $motif]);
        $this->client->notifier("Offre d'achat refusée", 'Votre offre pour « '.$this->annonce->bien->titre.' » est refusée : '.$motif);
    }

    /** Opération du diagramme : le client retire son offre tant qu'elle est en attente. */
    public function retirer(): void
    {
        $this->exigerEnAttente();
        $this->update(['statut' => StatutOffre::RETIREE]);
        $this->annonce->bien->notifierInterlocuteurs("Offre d'achat retirée", $this->client->prenom.' '.$this->client->nom.' retire son offre de '.Annonce::fcfa($this->montant).' pour « '.$this->annonce->bien->titre.' ».');
    }

    /** Une offre dont la validité est passée expire au premier accès. */
    private function exigerEnAttente(): void
    {
        if ($this->statut === StatutOffre::EN_ATTENTE && $this->expire_le->isPast()) {
            $this->update(['statut' => StatutOffre::EXPIREE]);
        }
        $this->exigerStatut(StatutOffre::EN_ATTENTE);
    }
}
