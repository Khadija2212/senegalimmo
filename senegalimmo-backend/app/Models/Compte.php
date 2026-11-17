<?php

namespace App\Models;

use App\Enums\CanalNotification;
use App\Enums\Role;
use App\Enums\StatutCompte;
use App\Exceptions\OperationRefusee;
use App\Models\Concerns\HeritageTableUnique;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

/**
 * Classe abstraite Compte du diagramme : identité, mot de passe, statut.
 * Les quatre classes concrètes partagent la table « users », la colonne « role » désigne la classe.
 */
abstract class Compte extends Authenticatable
{
    use HasApiTokens, HasFactory, HasUuids, HeritageTableUnique;

    private const NOM_JETON = 'api';

    protected $table = 'users';

    protected $fillable = [
        'prenom', 'nom', 'email', 'telephone', 'password', 'photo_url', 'statut', 'telephone_verifie', 'email_verifie',
        'derniere_connexion', 'date_naissance', 'profession', 'piece_identite_url', 'adresse', 'identite_verifiee',
        'numero_carte_professionnelle', 'agence', 'statut_validation', 'valide_le', 'niveau',
    ];

    protected $hidden = ['password', 'remember_token', 'piece_identite_url'];

    protected $casts = [
        'password' => 'hashed',
        'statut' => StatutCompte::class,
        'telephone_verifie' => 'boolean',
        'email_verifie' => 'boolean',
        'identite_verifiee' => 'boolean',
        'derniere_connexion' => 'datetime',
        'date_naissance' => 'date',
        'valide_le' => 'datetime',
    ];

    protected $appends = ['role'];

    protected static function colonneDiscriminante(): string
    {
        return 'role';
    }

    public static function sousClasses(): array
    {
        return [
            Role::CLIENT->value => Client::class,
            Role::PROPRIETAIRE->value => Proprietaire::class,
            Role::AGENT->value => Agent::class,
            Role::ADMINISTRATEUR->value => Administrateur::class,
        ];
    }

    /** Opération abstraite du diagramme : la classe concrète dit son rôle. */
    abstract public function role(): Role;

    public function getRoleAttribute(): string
    {
        return $this->role()->value;
    }

    /** Association « reçoit » : Compte 1 vers Notification 0..*. */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'compte_id')->latest();
    }

    /**
     * Opération du diagramme : vérifie l'adresse, le mot de passe et le statut,
     * puis renvoie un jeton d'accès.
     */
    public function sAuthentifier(string $email, string $motDePasse): string
    {
        if (strcasecmp($this->email, $email) !== 0 || ! Hash::check($motDePasse, $this->password)) {
            throw new OperationRefusee('Adresse e-mail ou mot de passe incorrect.', OperationRefusee::NON_AUTHENTIFIE);
        }
        if ($this->estSuspendu()) {
            throw new OperationRefusee("Ce compte est suspendu. Contactez l'administration.", OperationRefusee::INTERDIT);
        }
        $this->apresConnexion();

        return $this->createToken(self::NOM_JETON)->plainTextToken;
    }

    /** Ce qui se passe à chaque connexion réussie ; Utilisateur y note la dernière connexion. */
    protected function apresConnexion(): void {}

    /** Opération du diagramme. */
    public function modifierProfil(string $prenom, string $nom, ?string $photoUrl): void
    {
        $this->update(['prenom' => $prenom, 'nom' => $nom] + ($photoUrl !== null ? ['photo_url' => $photoUrl] : []));
    }

    /** Opération du diagramme : l'ancien mot de passe doit être le bon. */
    public function changerMotDePasse(string $ancien, string $nouveau): void
    {
        if (! Hash::check($ancien, $this->password)) {
            throw new OperationRefusee('Le mot de passe actuel est incorrect.');
        }
        $this->update(['password' => $nouveau]);
        $this->tokens()->where('id', '!=', $this->currentAccessToken()?->id)->delete();
    }

    public function estSuspendu(): bool
    {
        return in_array($this->statut, [StatutCompte::SUSPENDU, StatutCompte::SUPPRIME], true);
    }

    public function nomComplet(): string
    {
        return trim($this->prenom.' '.$this->nom);
    }

    /** Crée une Notification pour ce compte et l'envoie sur son canal. */
    public function notifier(string $titre, string $contenu, CanalNotification $canal = CanalNotification::PUSH): Notification
    {
        $n = $this->notifications()->create(['canal' => $canal, 'titre' => $titre, 'contenu' => $contenu]);
        $n->envoyer();

        return $n;
    }
}
