<?php

namespace App\Models;

use App\Enums\Role;
use App\Enums\StatutCompte;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Classe abstraite Compte du diagramme : identité, mot de passe, statut.
 * Toutes les classes concrètes partagent la table « users » ; la colonne « role »
 * (énumération Role) désigne la classe chargée.
 */
abstract class Compte extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /** Valeur de la colonne « role » propre à chaque classe concrète. */
    public const ROLE = '';

    /** @var array<string, class-string<Compte>> */
    public const CLASSES = [
        'client' => Client::class,
        'proprietaire' => Proprietaire::class,
        'agent' => Agent::class,
        'administrateur' => Administrateur::class,
    ];

    protected $table = 'users';

    protected $fillable = [
        'nom', 'prenom', 'email', 'telephone', 'adresse', 'password', 'role', 'photo', 'est_verifie',
        'devise', 'mode_diaspora', 'statut', 'agence_id', 'budget_min', 'budget_max', 'profession',
        'revenu_mensuel', 'numero_cni', 'est_premium', 'nom_agence', 'numero_licence', 'matricule', 'niveau',
        'document_identite', 'verification', 'verification_motif', 'telephone_verifie', 'email_verifie',
        'derniere_connexion', 'date_naissance', 'valide_le',
    ];

    protected $hidden = ['password', 'remember_token', 'document_identite'];

    protected $casts = [
        'password' => 'hashed',
        'est_verifie' => 'boolean',
        'est_premium' => 'boolean',
        'mode_diaspora' => 'boolean',
        'budget_min' => 'decimal:2',
        'budget_max' => 'decimal:2',
        'revenu_mensuel' => 'decimal:2',
        'telephone_verifie' => 'boolean',
        'email_verifie' => 'boolean',
        'derniere_connexion' => 'datetime',
        'date_naissance' => 'date',
        'valide_le' => 'datetime',
    ];

    /** Opération abstraite du diagramme. */
    abstract public function role(): Role;

    protected static function booted(): void
    {
        if (static::ROLE === '') {
            return;
        }
        static::addGlobalScope('role', fn (Builder $q) => $q->where('users.role', static::ROLE));
        static::creating(function (Compte $c): void {
            $c->setAttribute('role', static::ROLE);
        });
    }

    /** Tous les comptes, chacun chargé dans sa classe concrète. */
    public static function tous(): Builder
    {
        return (new Client())->newQueryWithoutScope('role');
    }

    /** Classe concrète correspondant à un rôle, pour créer un compte à l'inscription. */
    public static function classePour(string $role): string
    {
        return self::CLASSES[$role] ?? throw new \InvalidArgumentException('Rôle inconnu : ' . $role);
    }

    /** @param object|array<string, mixed> $attributes */
    public function newFromBuilder($attributes = [], $connection = null): Compte
    {
        $role = is_object($attributes) ? ($attributes->role ?? null) : ($attributes['role'] ?? null);
        $classe = self::CLASSES[$role] ?? static::class;

        $modele = (new $classe())->newInstance([], true);
        $modele->setRawAttributes((array) $attributes, true);
        $modele->setConnection($connection ?: $this->getConnectionName());
        $modele->fireModelEvent('retrieved', false);

        return $modele;
    }

    public function estSuspendu(): bool
    {
        return $this->statut !== StatutCompte::ACTIF->value;
    }

    /** Opération modifierProfil du diagramme. */
    public function modifierProfil(string $prenom, string $nom, ?string $photoUrl): void
    {
        $this->update(['prenom' => $prenom, 'nom' => $nom] + ($photoUrl !== null ? ['photo' => $photoUrl] : []));
    }
}
