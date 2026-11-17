<?php

namespace App\Models;

use App\Contracts\ServiceSignature;
use App\Contracts\ServiceStockage;
use App\Enums\StatutContrat;
use App\Enums\StatutSignature;
use App\Models\Concerns\ExigeStatut;
use App\Models\Concerns\HeritageTableUnique;
use App\Services\DocumentPdf;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Classe abstraite Contrat du diagramme. Bail, PromesseVente et Mandat partagent la table
 * « contrats » (colonne « nature »). Le contrat est composé de ses Signatures, une par signataire.
 */
abstract class Contrat extends Model
{
    use ExigeStatut, HasUuids, HeritageTableUnique;

    private const LONGUEUR_ALEATOIRE = 5;

    private const DOSSIER = 'contrats';

    protected $table = 'contrats';

    protected $fillable = [
        'document_url', 'statut', 'signe_le', 'date_debut',
        'demande_location_id', 'loyer_mensuel', 'charges', 'caution', 'duree_mois', 'jour_echeance',
        'offre_achat_id', 'prix_vente', 'indemnite_immobilisation', 'date_limite_acte', 'conditions_suspensives',
        'bien_id', 'agent_id', 'type', 'taux_commission', 'date_fin',
    ];

    protected $attributes = ['statut' => 'brouillon'];

    protected $casts = ['statut' => StatutContrat::class, 'signe_le' => 'datetime', 'date_debut' => 'date'];

    protected $appends = ['nature'];

    protected static function colonneDiscriminante(): string
    {
        return 'nature';
    }

    public static function sousClasses(): array
    {
        return ['bail' => Bail::class, 'promesse_vente' => PromesseVente::class, 'mandat' => Mandat::class];
    }

    protected static function booted(): void
    {
        static::creating(function (Contrat $c): void {
            $c->setAttribute('reference', $c->prefixeReference().now()->format('ymd').'-'.Str::upper(Str::random(self::LONGUEUR_ALEATOIRE)));
        });
    }

    /** Opération abstraite du diagramme : qui doit signer ce contrat. @return list<Utilisateur> */
    abstract public function signataires(): array;

    /** Le bien sur lequel porte le contrat. */
    abstract public function bienConcerne(): Bien;

    abstract protected function prefixeReference(): string;

    /** Vue Blade du document PDF. */
    abstract protected function vueDocument(): string;

    /** Ce qui suit la dernière signature (annonce conclue, mandat actif). */
    protected function apresSignature(): void {}

    public function getNatureAttribute(): string
    {
        return (string) static::valeurDiscriminante();
    }

    /** Composition Contrat 1 vers Signature 1..*. */
    public function signatures(): HasMany
    {
        return $this->hasMany(Signature::class, 'contrat_id');
    }

    public function concerne(Compte $c): bool
    {
        return collect($this->signataires())->contains(fn (Utilisateur $u): bool => $u->is($c));
    }

    /** Opération du diagramme : produit le PDF, le range et renvoie son adresse. */
    public function genererDocument(): string
    {
        $pdf = DocumentPdf::rendre($this->vueDocument(), ['contrat' => $this, 'bien' => $this->bienConcerne(), 'signatures' => $this->signatures()->with('signataire')->get()]);
        $url = app(ServiceStockage::class)->televerser($pdf, self::DOSSIER.'/'.$this->reference.'.pdf');
        $this->update(['document_url' => $url]);

        return $url;
    }

    /** Opération du diagramme : une Signature par signataire, demandée au ServiceSignature. */
    public function envoyerEnSignature(): void
    {
        $this->exigerStatut(StatutContrat::BROUILLON);
        $signataires = $this->signataires();
        $demande = app(ServiceSignature::class)->creerDemande($this->genererDocument(), array_map(fn (Utilisateur $u) => $u->email, $signataires));

        DB::transaction(function () use ($signataires, $demande): void {
            foreach ($signataires as $rang => $u) {
                $this->signatures()->create(['signataire_id' => $u->id, 'reference_service' => $demande.'-'.($rang + 1)]);
            }
            $this->update(['statut' => StatutContrat::EN_SIGNATURE]);
        });
        foreach ($signataires as $u) {
            $u->notifier('Contrat à signer', 'Le contrat '.$this->reference.' attend votre signature.');
        }
    }

    public function estSigneParTous(): bool
    {
        return $this->signatures()->exists()
            && $this->signatures()->where('statut', '!=', StatutSignature::SIGNEE)->doesntExist();
    }

    /** Relit l'état de chaque signature chez le service ; à la dernière, le contrat est signé. */
    public function actualiserSignatures(): void
    {
        $service = app(ServiceSignature::class);
        foreach ($this->signatures()->where('statut', StatutSignature::EN_ATTENTE)->get() as $s) {
            $s->constater($service->statut($s->reference_service));
        }
        if ($this->statut === StatutContrat::EN_SIGNATURE && $this->estSigneParTous()) {
            $this->update(['statut' => StatutContrat::SIGNE, 'signe_le' => now()]);
            $this->update(['document_url' => $service->documentSigne($this->signatures()->first()->reference_service)]);
            $this->apresSignature();
        }
    }

    /** Résiliation commune au Bail et au Mandat : seul un contrat signé se résilie. */
    protected function resilierContrat(string $motif): void
    {
        $this->exigerStatut(StatutContrat::SIGNE);
        $this->update(['statut' => StatutContrat::RESILIE]);
        foreach ($this->signataires() as $u) {
            $u->notifier('Contrat résilié', 'Le contrat '.$this->reference.' est résilié : '.$motif);
        }
    }
}
