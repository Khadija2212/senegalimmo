<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Enrichissement de la table users
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('budget_min', 15, 2)->nullable();
            $table->decimal('budget_max', 15, 2)->nullable();
            $table->string('profession')->nullable();
            $table->decimal('revenu_mensuel', 15, 2)->nullable();
            $table->string('numero_cni')->nullable();
            $table->boolean('est_premium')->default(false);
            $table->string('nom_agence')->nullable();
            $table->string('numero_licence')->nullable();
            $table->string('matricule')->nullable();
            $table->string('niveau')->nullable();
            $table->string('document_identite')->nullable();
        });

        // Enrichissement de la table visites
        Schema::table('visites', function (Blueprint $table) {
            $table->foreignId('agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('compte_rendu')->nullable();
        });

        // Catégories de biens
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('icone')->nullable();
            $table->timestamps();
        });

        // Liaison biens -> catégories
        Schema::table('biens', function (Blueprint $table) {
            $table->foreignId('categorie_id')->nullable()->constrained('categories')->nullOnDelete();
        });

        // Favoris des utilisateurs (acheteurs, locataires)
        Schema::create('favoris', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('bien_id')->constrained('biens')->onDelete('cascade');
            $table->unique(['user_id', 'bien_id']);
            $table->timestamps();
        });

        // Signalements d'annonces
        Schema::create('signalements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('bien_id')->constrained('biens')->onDelete('cascade');
            $table->string('motif');
            $table->text('description')->nullable();
            $table->enum('statut', ['en_attente', 'traite', 'rejete'])->default('en_attente');
            $table->text('reponse_admin')->nullable();
            $table->timestamps();
        });

        // Demandes de retrait de portefeuille
        Schema::create('demandes_retrait', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->decimal('montant', 15, 2);
            $table->enum('methode', ['wave', 'orange_money', 'virement'])->default('wave');
            $table->string('numero_telephone');
            $table->enum('statut', ['en_attente', 'validee', 'rejetee'])->default('en_attente');
            $table->text('motif_rejet')->nullable();
            $table->timestamp('traitee_le')->nullable();
            $table->timestamps();
        });

        // Demandes de report d'échéance (location ou achat)
        Schema::create('reports_echeance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('contrat_id')->nullable()->constrained('contrats')->nullOnDelete();
            $table->foreignId('promesse_id')->nullable()->constrained('promesses_vente')->nullOnDelete();
            $table->date('date_report_souhaitee');
            $table->text('motif');
            $table->enum('statut', ['en_attente', 'acceptee', 'refusee'])->default('en_attente');
            $table->text('reponse')->nullable();
            $table->timestamps();
        });

        // Adapter la table paiements pour supporter l'indemnité d'immobilisation de promesse de vente
        Schema::table('paiements', function (Blueprint $table) {
            $table->foreignId('promesse_id')->nullable()->constrained('promesses_vente')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('promesse_id');
        });

        Schema::dropIfExists('reports_echeance');
        Schema::dropIfExists('demandes_retrait');
        Schema::dropIfExists('signalements');
        Schema::dropIfExists('favoris');

        Schema::table('biens', function (Blueprint $table) {
            $table->dropConstrainedForeignId('categorie_id');
        });

        Schema::dropIfExists('categories');

        Schema::table('visites', function (Blueprint $table) {
            $table->dropConstrainedForeignId('agent_id');
            $table->dropColumn('compte_rendu');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
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
            ]);
        });
    }
};
