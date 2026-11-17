<?php

namespace App\Models;

use App\Enums\StatutContrat;
use App\Enums\StatutVisite;
use App\Exceptions\OperationRefusee;
use App\Models\Concerns\ExigeStatut;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/** Visite du diagramme : demandée par un Client, concerne une Annonce, composée d'un CompteRendu. */
class Visite extends Model
{
    use ExigeStatut, HasUuids;

    protected $table = 'visites';

    protected $fillable = ['annonce_id', 'date_heure', 'statut', 'motif_refus'];

    protected $attributes = ['statut' => 'demandee'];

    protected $casts = ['date_heure' => 'datetime', 'statut' => StatutVisite::class];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'client_id');
    }

    public function annonce(): BelongsTo
    {
        return $this->belongsTo(Annonce::class);
    }

    /** Composition Visite 1 vers CompteRendu 0..1. */
    public function compteRendu(): HasOne
    {
        return $this->hasOne(CompteRendu::class);
    }

    public function confirmer(): void
    {
        $this->exigerStatut(StatutVisite::DEMANDEE);
        $this->update(['statut' => StatutVisite::CONFIRMEE]);
        $this->client->notifier('Visite confirmée', 'Votre visite de « '.$this->titreBien().' » est confirmée pour le '.$this->dateLisible().'.');
    }

    public function refuser(string $motif): void
    {
        $this->exigerStatut(StatutVisite::DEMANDEE);
        $this->update(['statut' => StatutVisite::REFUSEE, 'motif_refus' => $motif]);
        $this->client->notifier('Visite refusée', 'Votre visite de « '.$this->titreBien().' » est refusée : '.$motif);
    }

    public function annuler(): void
    {
        $this->exigerStatut(StatutVisite::DEMANDEE, StatutVisite::CONFIRMEE);
        $this->update(['statut' => StatutVisite::ANNULEE]);
        $this->annonce->bien->notifierInterlocuteurs('Visite annulée', 'La visite du '.$this->dateLisible().' pour « '.$this->titreBien().' » est annulée.');
    }

    /** Opération du diagramme : la nouvelle date doit être reconfirmée. */
    public function reprogrammer(Carbon $d): void
    {
        $this->exigerStatut(StatutVisite::DEMANDEE, StatutVisite::CONFIRMEE);
        if ($d->lte(now())) {
            throw new OperationRefusee('La visite doit être prévue dans le futur.');
        }
        $this->update(['date_heure' => $d, 'statut' => StatutVisite::DEMANDEE]);
        $texte = 'La visite de « '.$this->titreBien().' » est reprogrammée au '.$this->dateLisible().'.';
        $this->client->notifier('Visite reprogrammée', $texte);
        $this->annonce->bien->notifierInterlocuteurs('Visite reprogrammée', $texte);
    }

    /** Une visite confirmée dont l'heure est passée devient effectuée. */
    public function marquerEffectuee(): void
    {
        $this->exigerStatut(StatutVisite::CONFIRMEE, StatutVisite::EFFECTUEE);
        if ($this->date_heure->isFuture()) {
            throw new OperationRefusee("La visite n'a pas encore eu lieu.");
        }
        $this->update(['statut' => StatutVisite::EFFECTUEE]);
    }

    /** Le client a-t-il signé un bail ou une promesse de vente sur cette annonce ? */
    public function aAbouti(): bool
    {
        $filtre = fn ($q) => $q->where('annonce_id', $this->annonce_id)->where('client_id', $this->client_id);

        return Bail::where('statut', StatutContrat::SIGNE)->whereHas('demandeLocation', $filtre)->exists()
            || PromesseVente::where('statut', StatutContrat::SIGNE)->whereHas('offreAchat', $filtre)->exists();
    }

    private function titreBien(): string
    {
        return $this->annonce->bien->titre;
    }

    private function dateLisible(): string
    {
        return $this->date_heure->format('d/m/Y à H\hi');
    }
}
