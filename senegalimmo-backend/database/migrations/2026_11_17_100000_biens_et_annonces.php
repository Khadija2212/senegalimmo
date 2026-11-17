<?php

use App\Enums\StatutAnnonce;
use App\Enums\StatutBien;
use App\Enums\TypeBien;
use App\Enums\TypeMedia;
use App\Enums\TypeTransaction;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Paquet Biens et annonces : Bien, Media, OptionPremium, Annonce, favoris (Client 0..* Annonce). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('proprietaire_id')->constrained('users')->cascadeOnDelete();
            $table->string('titre');
            $table->text('description');
            $table->enum('type', TypeBien::valeurs());
            $table->double('surface');
            $table->unsignedSmallInteger('nombre_pieces');
            $table->unsignedSmallInteger('nombre_chambres');
            $table->boolean('meuble')->default(false);
            $table->string('adresse');
            $table->string('quartier');
            $table->string('ville');
            $table->double('latitude')->nullable();
            $table->double('longitude')->nullable();
            $table->enum('statut', StatutBien::valeurs())->default(StatutBien::BROUILLON->value);
            $table->timestamps();
            $table->index(['ville', 'quartier']);
        });

        Schema::create('medias', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('bien_id')->constrained('biens')->cascadeOnDelete();
            $table->string('url');
            $table->enum('type', TypeMedia::valeurs());
            $table->unsignedSmallInteger('ordre')->default(0);
            $table->timestamp('televerse_le');
            $table->timestamps();
        });

        Schema::create('options_premium', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('libelle');
            $table->unsignedSmallInteger('duree_jours');
            $table->unsignedBigInteger('prix');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        Schema::create('annonces', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('bien_id')->constrained('biens')->cascadeOnDelete();
            $table->foreignUuid('option_premium_id')->nullable()->constrained('options_premium')->nullOnDelete();
            $table->string('reference')->unique();
            $table->enum('type_transaction', TypeTransaction::valeurs());
            $table->unsignedBigInteger('prix');
            $table->unsignedBigInteger('charges')->default(0);
            $table->unsignedBigInteger('caution')->default(0);
            $table->enum('statut', StatutAnnonce::valeurs())->default(StatutAnnonce::EN_MODERATION->value);
            $table->boolean('badge_verifie')->default(false);
            $table->timestamp('premium_jusquau')->nullable();
            $table->unsignedInteger('nombre_vues')->default(0);
            $table->timestamp('publiee_le')->nullable();
            $table->timestamps();
            $table->index(['statut', 'type_transaction']);
        });
        DB::statement('ALTER TABLE annonces ADD CONSTRAINT annonces_prix_check CHECK (prix > 0)');

        Schema::create('favoris', function (Blueprint $table) {
            $table->foreignUuid('client_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('annonce_id')->constrained('annonces')->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['client_id', 'annonce_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('favoris');
        Schema::dropIfExists('annonces');
        Schema::dropIfExists('options_premium');
        Schema::dropIfExists('medias');
        Schema::dropIfExists('biens');
    }
};
