<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'telephone',
        'adresse',
        'password',
        'role',
        'photo',
        'est_verifie',
        'solde_portefeuille',
        'devise',
        'mode_diaspora',
        'statut',
        'agence_id',
        'budget_min',
        'budget_max',
        'profession',
        'revenu_mensuel',
        'numero_cni',
        'est_premium',
        'nom_agence',
        'numero_licence',
        'matricule',
        'niveau',
        'document_identite',
        'verification',
        'verification_motif',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'document_identite',
    ];

    protected $casts = [
        'password' => 'hashed',
        'est_verifie' => 'boolean',
        'est_premium' => 'boolean',
        'mode_diaspora' => 'boolean',
        'solde_portefeuille' => 'decimal:2',
        'budget_min' => 'decimal:2',
        'budget_max' => 'decimal:2',
        'revenu_mensuel' => 'decimal:2',
    ];

    // Relations
    public function biens()
    {
        return $this->hasMany(Bien::class, 'proprietaire_id');
    }

    public function annonces()
    {
        return $this->hasMany(Annonce::class, 'auteur_id');
    }

    public function contratsProprietaire()
    {
        return $this->hasMany(Contrat::class, 'proprietaire_id');
    }

    public function contratsLocataire()
    {
        return $this->hasMany(Contrat::class, 'locataire_id');
    }

    public function messagesEnvoyes()
    {
        return $this->hasMany(Message::class, 'expediteur_id');
    }

    public function messagesRecus()
    {
        return $this->hasMany(Message::class, 'destinataire_id');
    }

    public function notationsRecues()
    {
        return $this->hasMany(Notation::class, 'note_id');
    }

    public function favoris()
    {
        return $this->hasMany(Favori::class);
    }

    public function biensFavoris()
    {
        return $this->belongsToMany(Bien::class, 'favoris', 'user_id', 'bien_id');
    }

    public function demandesRetrait()
    {
        return $this->hasMany(DemandeRetrait::class);
    }

    public function signalements()
    {
        return $this->hasMany(Signalement::class);
    }

    public function isClient(): bool
    {
        return in_array($this->role, ['client', 'locataire', 'acheteur']);
    }
}
