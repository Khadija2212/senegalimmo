<?php

namespace App\Models;

use App\Contracts\ServiceCartographie;
use App\Enums\StatutBien;
use App\Enums\TypeBien;
use App\Exceptions\PasserelleIndisponible;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Log;

/** Bien du diagramme : possédé par un Proprietaire, composé de Media, présenté par des Annonces. */
class Bien extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'biens';

    protected $fillable = [
        'titre', 'description', 'type', 'surface', 'nombre_pieces', 'nombre_chambres', 'meuble',
        'adresse', 'quartier', 'ville', 'latitude', 'longitude', 'statut',
    ];

    protected $attributes = ['statut' => 'brouillon'];

    protected $casts = [
        'type' => TypeBien::class,
        'statut' => StatutBien::class,
        'surface' => 'float',
        'nombre_pieces' => 'integer',
        'nombre_chambres' => 'integer',
        'meuble' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function proprietaire(): BelongsTo
    {
        return $this->belongsTo(Proprietaire::class, 'proprietaire_id');
    }

    /** Composition Bien 1 vers Media 0..*. */
    public function medias(): HasMany
    {
        return $this->hasMany(Media::class)->orderBy('ordre');
    }

    public function annonces(): HasMany
    {
        return $this->hasMany(Annonce::class);
    }

    /** Association « porte sur » : Mandat 0..* vers Bien 1. */
    public function mandats(): HasMany
    {
        return $this->hasMany(Mandat::class, 'bien_id');
    }

    public function mandatActif(): ?Mandat
    {
        return $this->mandats()->actifs()->first();
    }

    /**
     * Opération du diagramme («use» ServiceCartographie) : place le bien sur la carte
     * à partir de son adresse, si ses coordonnées manquent.
     */
    public function geolocaliser(): void
    {
        if ($this->latitude !== null && $this->longitude !== null) {
            return;
        }
        try {
            [$lat, $lng] = app(ServiceCartographie::class)->geocoder($this->adresseComplete());
            $this->update(['latitude' => $lat, 'longitude' => $lng]);
        } catch (PasserelleIndisponible $e) {
            Log::warning('Géolocalisation impossible', ['bien' => $this->id, 'raison' => $e->getMessage()]);
        }
    }

    public function adresseComplete(): string
    {
        return implode(', ', array_filter([$this->adresse, $this->quartier, $this->ville, 'Sénégal']));
    }

    /** Opération du diagramme : le média rejoint la fin de la galerie. */
    public function ajouterMedia(Media $m): void
    {
        $m->ordre = (int) $this->medias()->max('ordre') + 1;
        $this->medias()->save($m);
    }

    public function estDisponible(): bool
    {
        return $this->statut === StatutBien::DISPONIBLE;
    }

    /** Le propriétaire et, s'il existe, l'agent du mandat actif : ceux qui répondent aux clients. @return list<Utilisateur> */
    public function interlocuteurs(): array
    {
        return array_values(array_filter([$this->proprietaire, $this->mandatActif()?->agent]));
    }

    public function estGerePar(Compte $c): bool
    {
        return collect($this->interlocuteurs())->contains(fn (Utilisateur $u): bool => $u->is($c));
    }

    public function notifierInterlocuteurs(string $titre, string $contenu): void
    {
        foreach ($this->interlocuteurs() as $u) {
            $u->notifier($titre, $contenu);
        }
    }
}
