<?php

use App\Enums\MethodePaiement;
use App\Enums\StatutPaiement;
use App\Enums\StatutRetrait;
use App\Enums\TypeEcriture;
use App\Enums\TypeTransaction;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Paquet Paiements : RegleCommission, Paiement abstrait et ses sous-classes (colonne « type »),
 * Recu, Portefeuille, Ecriture, Retrait.
 */
return new class extends Migration
{
    private const TYPES_PAIEMENT = ['loyer', 'caution', 'indemnite'];

    public function up(): void
    {
        Schema::create('regles_commission', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('administrateur_id')->constrained('users');
            $table->enum('type_transaction', TypeTransaction::valeurs());
            $table->decimal('taux', 5, 2);
            $table->unsignedBigInteger('montant_minimum')->default(0);
            $table->date('actif_depuis');
            $table->timestamps();
        });
        DB::statement('ALTER TABLE regles_commission ADD CONSTRAINT regles_commission_taux_check CHECK (taux BETWEEN 0 AND 100)');

        Schema::create('paiements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('type', self::TYPES_PAIEMENT);
            $table->foreignUuid('bail_id')->nullable()->constrained('contrats');
            $table->foreignUuid('promesse_id')->nullable()->constrained('contrats');
            $table->foreignUuid('regle_commission_id')->constrained('regles_commission');
            $table->string('reference')->unique();
            $table->unsignedBigInteger('montant');
            $table->unsignedBigInteger('frais_service')->default(0);
            $table->unsignedBigInteger('commission')->default(0);
            $table->enum('methode', MethodePaiement::valeurs());
            $table->string('reference_paytech')->nullable()->index();
            $table->enum('statut', StatutPaiement::valeurs())->default(StatutPaiement::EN_ATTENTE->value);
            $table->timestamp('confirme_le')->nullable();
            $table->date('mois_concerne')->nullable();
            $table->boolean('restituable')->nullable();
            $table->timestamps();
        });
        DB::statement('ALTER TABLE paiements ADD CONSTRAINT paiements_montant_check CHECK (montant > 0)');
        DB::statement("ALTER TABLE paiements ADD CONSTRAINT paiements_cible_check CHECK ((type = 'indemnite' AND promesse_id IS NOT NULL AND bail_id IS NULL) OR (type <> 'indemnite' AND bail_id IS NOT NULL AND promesse_id IS NULL))");
        DB::statement("ALTER TABLE paiements ADD CONSTRAINT paiements_loyer_check CHECK ((type = 'loyer') = (mois_concerne IS NOT NULL))");
        DB::statement("ALTER TABLE paiements ADD CONSTRAINT paiements_restituable_check CHECK ((type = 'indemnite') = (restituable IS NOT NULL))");

        Schema::create('recus', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('paiement_id')->unique()->constrained('paiements')->cascadeOnDelete();
            $table->string('numero')->unique();
            $table->string('document_url')->nullable();
            $table->timestamp('emis_le');
            $table->timestamps();
        });

        Schema::create('portefeuilles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('solde_disponible')->default(0);
            $table->unsignedBigInteger('solde_en_attente')->default(0);
            $table->timestamp('mis_a_jour_le')->nullable();
            $table->timestamps();
        });

        Schema::create('retraits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('portefeuille_id')->constrained('portefeuilles')->cascadeOnDelete();
            $table->foreignUuid('validateur_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('montant');
            $table->enum('methode', MethodePaiement::valeurs());
            $table->string('numero_beneficiaire');
            $table->enum('statut', StatutRetrait::valeurs())->default(StatutRetrait::DEMANDE->value);
            $table->string('reference_paytech')->nullable()->index();
            $table->text('motif_rejet')->nullable();
            $table->timestamp('demande_le');
            $table->timestamp('traite_le')->nullable();
            $table->timestamps();
        });

        Schema::create('ecritures', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('portefeuille_id')->constrained('portefeuilles')->cascadeOnDelete();
            $table->foreignUuid('paiement_id')->nullable()->constrained('paiements')->nullOnDelete();
            $table->foreignUuid('retrait_id')->nullable()->constrained('retraits')->nullOnDelete();
            $table->enum('type', TypeEcriture::valeurs());
            $table->bigInteger('montant');
            $table->bigInteger('solde_apres');
            $table->string('libelle');
            $table->timestamp('date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ecritures');
        Schema::dropIfExists('retraits');
        Schema::dropIfExists('portefeuilles');
        Schema::dropIfExists('recus');
        Schema::dropIfExists('paiements');
        Schema::dropIfExists('regles_commission');
    }
};
