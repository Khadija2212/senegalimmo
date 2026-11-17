<?php

use App\Enums\MotifSignalement;
use App\Enums\NiveauInteret;
use App\Enums\StatutDemande;
use App\Enums\StatutOffre;
use App\Enums\StatutSignalement;
use App\Enums\StatutVisite;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Démarches d'un Client sur une Annonce : DemandeLocation, OffreAchat, Visite et CompteRendu, Signalement. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demandes_location', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('annonce_id')->constrained('annonces')->cascadeOnDelete();
            $table->date('date_entree_souhaitee');
            $table->unsignedSmallInteger('duree_mois');
            $table->text('message')->nullable();
            $table->enum('statut', StatutDemande::valeurs())->default(StatutDemande::EN_ATTENTE->value);
            $table->timestamps();
        });
        DB::statement('ALTER TABLE demandes_location ADD CONSTRAINT demandes_location_duree_check CHECK (duree_mois > 0)');

        Schema::create('offres_achat', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('annonce_id')->constrained('annonces')->cascadeOnDelete();
            $table->unsignedBigInteger('montant');
            $table->text('message')->nullable();
            $table->enum('statut', StatutOffre::valeurs())->default(StatutOffre::EN_ATTENTE->value);
            $table->timestamp('expire_le');
            $table->timestamps();
        });
        DB::statement('ALTER TABLE offres_achat ADD CONSTRAINT offres_achat_montant_check CHECK (montant > 0)');

        Schema::create('visites', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('annonce_id')->constrained('annonces')->cascadeOnDelete();
            $table->timestamp('date_heure');
            $table->enum('statut', StatutVisite::valeurs())->default(StatutVisite::DEMANDEE->value);
            $table->text('motif_refus')->nullable();
            $table->timestamps();
        });

        Schema::create('comptes_rendus', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('visite_id')->unique()->constrained('visites')->cascadeOnDelete();
            $table->text('contenu');
            $table->enum('interet_client', NiveauInteret::valeurs());
            $table->timestamp('redige_le');
            $table->timestamps();
        });

        Schema::create('signalements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('annonce_id')->nullable()->constrained('annonces')->nullOnDelete();
            $table->foreignUuid('administrateur_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('motif', MotifSignalement::valeurs());
            $table->text('description');
            $table->enum('statut', StatutSignalement::valeurs())->default(StatutSignalement::OUVERT->value);
            $table->text('resolution')->nullable();
            $table->timestamp('traite_le')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('signalements');
        Schema::dropIfExists('comptes_rendus');
        Schema::dropIfExists('visites');
        Schema::dropIfExists('offres_achat');
        Schema::dropIfExists('demandes_location');
    }
};
