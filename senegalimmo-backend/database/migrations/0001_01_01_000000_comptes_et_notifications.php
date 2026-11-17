<?php

use App\Enums\CanalNotification;
use App\Enums\Role;
use App\Enums\RoleAdmin;
use App\Enums\StatutCompte;
use App\Enums\StatutValidation;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Paquet Comptes du diagramme : Compte et ses sous-classes en héritage à table unique
 * (colonne « role »), Notification reçue par un Compte.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('role', Role::valeurs());
            $table->string('prenom');
            $table->string('nom');
            $table->string('email')->unique();
            $table->string('telephone');
            $table->string('password');
            $table->string('photo_url')->nullable();
            $table->enum('statut', StatutCompte::valeurs())->default(StatutCompte::ACTIF->value);
            $table->boolean('telephone_verifie')->default(false);
            $table->boolean('email_verifie')->default(false);
            $table->timestamp('derniere_connexion')->nullable();
            $table->date('date_naissance')->nullable();
            $table->string('profession')->nullable();
            $table->string('piece_identite_url')->nullable();
            $table->string('adresse')->nullable();
            $table->boolean('identite_verifiee')->default(false);
            $table->string('numero_carte_professionnelle')->nullable();
            $table->string('agence')->nullable();
            $table->enum('statut_validation', StatutValidation::valeurs())->nullable();
            $table->timestamp('valide_le')->nullable();
            $table->enum('niveau', RoleAdmin::valeurs())->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_niveau_admin_check CHECK ((role = 'administrateur') = (niveau IS NOT NULL))");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_validation_agent_check CHECK ((role = 'agent') = (statut_validation IS NOT NULL))");

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('compte_id')->constrained('users')->cascadeOnDelete();
            $table->enum('canal', CanalNotification::valeurs());
            $table->string('titre');
            $table->text('contenu');
            $table->timestamp('envoyee_le')->nullable();
            $table->timestamp('lue_le')->nullable();
            $table->timestamps();
            $table->index(['compte_id', 'lue_le']);
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->uuidMorphs('tokenable');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
