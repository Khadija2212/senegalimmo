<?php

use App\Enums\StatutContrat;
use App\Enums\StatutSignature;
use App\Enums\TypeEtatDesLieux;
use App\Enums\TypeMandat;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Paquet Contrats : Contrat abstrait et ses sous-classes Bail, PromesseVente, Mandat
 * en héritage à table unique (colonne « nature »), Signature, EtatDesLieux et ses photos.
 */
return new class extends Migration
{
    private const NATURES = ['bail', 'promesse_vente', 'mandat'];

    public function up(): void
    {
        Schema::create('contrats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('nature', self::NATURES);
            $table->string('reference')->unique();
            $table->string('document_url')->nullable();
            $table->enum('statut', StatutContrat::valeurs())->default(StatutContrat::BROUILLON->value);
            $table->timestamp('signe_le')->nullable();
            $table->date('date_debut')->nullable();
            $table->foreignUuid('demande_location_id')->nullable()->unique()->constrained('demandes_location');
            $table->unsignedBigInteger('loyer_mensuel')->nullable();
            $table->unsignedBigInteger('charges')->nullable();
            $table->unsignedBigInteger('caution')->nullable();
            $table->unsignedSmallInteger('duree_mois')->nullable();
            $table->unsignedSmallInteger('jour_echeance')->nullable();
            $table->foreignUuid('offre_achat_id')->nullable()->unique()->constrained('offres_achat');
            $table->unsignedBigInteger('prix_vente')->nullable();
            $table->unsignedBigInteger('indemnite_immobilisation')->nullable();
            $table->date('date_limite_acte')->nullable();
            $table->text('conditions_suspensives')->nullable();
            $table->foreignUuid('bien_id')->nullable()->constrained('biens');
            $table->foreignUuid('agent_id')->nullable()->constrained('users');
            $table->enum('type', TypeMandat::valeurs())->nullable();
            $table->decimal('taux_commission', 5, 2)->nullable();
            $table->date('date_fin')->nullable();
            $table->timestamps();
        });
        DB::statement("ALTER TABLE contrats ADD CONSTRAINT contrats_bail_check CHECK (nature <> 'bail' OR (demande_location_id IS NOT NULL AND loyer_mensuel > 0 AND charges IS NOT NULL AND caution IS NOT NULL AND date_debut IS NOT NULL AND duree_mois > 0 AND jour_echeance BETWEEN 1 AND 28))");
        DB::statement("ALTER TABLE contrats ADD CONSTRAINT contrats_promesse_check CHECK (nature <> 'promesse_vente' OR (offre_achat_id IS NOT NULL AND prix_vente > 0 AND indemnite_immobilisation IS NOT NULL AND date_limite_acte IS NOT NULL))");
        DB::statement("ALTER TABLE contrats ADD CONSTRAINT contrats_mandat_check CHECK (nature <> 'mandat' OR (bien_id IS NOT NULL AND agent_id IS NOT NULL AND type IS NOT NULL AND taux_commission BETWEEN 0 AND 100 AND date_debut IS NOT NULL AND date_fin > date_debut))");

        Schema::create('signatures', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('contrat_id')->constrained('contrats')->cascadeOnDelete();
            $table->foreignUuid('signataire_id')->constrained('users');
            $table->enum('statut', StatutSignature::valeurs())->default(StatutSignature::EN_ATTENTE->value);
            $table->string('reference_service')->nullable();
            $table->timestamp('signe_le')->nullable();
            $table->string('adresse_ip', 45)->nullable();
            $table->timestamps();
            $table->unique(['contrat_id', 'signataire_id']);
        });

        Schema::create('etats_des_lieux', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('bail_id')->constrained('contrats')->cascadeOnDelete();
            $table->enum('type', TypeEtatDesLieux::valeurs());
            $table->timestamp('date');
            $table->text('observations')->nullable();
            $table->text('releve_compteurs')->nullable();
            $table->timestamp('valide_le')->nullable();
            $table->timestamps();
            $table->unique(['bail_id', 'type']);
        });

        Schema::create('etat_des_lieux_media', function (Blueprint $table) {
            $table->foreignUuid('etat_des_lieux_id')->constrained('etats_des_lieux')->cascadeOnDelete();
            $table->foreignUuid('media_id')->constrained('medias')->cascadeOnDelete();
            $table->primary(['etat_des_lieux_id', 'media_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('etat_des_lieux_media');
        Schema::dropIfExists('etats_des_lieux');
        Schema::dropIfExists('signatures');
        Schema::dropIfExists('contrats');
    }
};
