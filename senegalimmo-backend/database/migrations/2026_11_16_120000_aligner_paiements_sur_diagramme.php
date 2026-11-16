<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Aligne les paiements sur le diagramme de classes :
 * Paiement abstrait (PaiementLoyer, PaiementCaution, PaiementIndemnite) en une table,
 * montants en entiers FCFA, StatutPaiement et MethodePaiement complets,
 * RegleCommission appliquée à chaque paiement, Recu composé dans Paiement.
 * Payeur et bénéficiaire ne sont plus stockés : ils se déduisent du bail ou de la promesse.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->creerReglesCommission();
        $this->ajouterColonnes();
        $this->reprendreDonnees();
        $this->remplacerContraintes();
        $this->retirerAnciennesColonnes();
        $this->creerRecus();
    }

    private function creerReglesCommission(): void
    {
        Schema::create('regles_commission', function (Blueprint $table) {
            $table->id();
            $table->string('type_transaction');
            $table->decimal('taux', 5, 2);
            $table->unsignedBigInteger('montant_minimum')->default(0);
            $table->date('actif_depuis');
            $table->timestamps();
        });
        DB::statement("ALTER TABLE regles_commission ADD CONSTRAINT regles_commission_type_check CHECK (type_transaction IN ('location', 'vente'))");

        // Taux à 0 % : l'administrateur les fixe ensuite (cas d'utilisation « Gérer les commissions »).
        $maintenant = now();
        DB::table('regles_commission')->insert([
            ['type_transaction' => 'location', 'taux' => 0, 'montant_minimum' => 0, 'actif_depuis' => '2026-01-01', 'created_at' => $maintenant, 'updated_at' => $maintenant],
            ['type_transaction' => 'vente', 'taux' => 0, 'montant_minimum' => 0, 'actif_depuis' => '2026-01-01', 'created_at' => $maintenant, 'updated_at' => $maintenant],
        ]);
    }

    private function ajouterColonnes(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->unsignedBigInteger('frais_service')->default(0);
            $table->unsignedBigInteger('commission')->default(0);
            $table->string('reference_paytech')->nullable()->index();
            $table->timestamp('confirme_le')->nullable();
            $table->date('mois_concerne')->nullable();
            $table->boolean('restituable')->default(false);
            $table->foreignId('regle_commission_id')->nullable()->constrained('regles_commission');
        });
        foreach (['methode', 'type', 'statut'] as $colonne) {
            DB::statement("ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_{$colonne}_check");
        }
    }

    private function reprendreDonnees(): void
    {
        DB::table('paiements')->whereNotIn('type', ['loyer', 'caution', 'indemnite'])->delete();
        DB::statement("UPDATE paiements SET statut = 'reussi' WHERE statut = 'confirme'");
        DB::statement('UPDATE paiements SET reference_paytech = token_paytech, confirme_le = date_paiement');
        DB::statement("UPDATE paiements SET mois_concerne = to_date(periode || '-01', 'YYYY-MM-DD') WHERE periode IS NOT NULL");
        DB::statement("UPDATE paiements SET regle_commission_id = (SELECT id FROM regles_commission WHERE type_transaction = CASE WHEN paiements.type = 'indemnite' THEN 'vente' ELSE 'location' END ORDER BY actif_depuis DESC LIMIT 1)");
        DB::statement('ALTER TABLE paiements ALTER COLUMN montant TYPE bigint USING round(montant)');
        DB::statement('ALTER TABLE paiements ALTER COLUMN regle_commission_id SET NOT NULL');
    }

    private function remplacerContraintes(): void
    {
        DB::statement("ALTER TABLE paiements ADD CONSTRAINT paiements_type_check CHECK (type IN ('loyer', 'caution', 'indemnite'))");
        DB::statement("ALTER TABLE paiements ADD CONSTRAINT paiements_statut_check CHECK (statut IN ('en_attente', 'reussi', 'echoue', 'rembourse'))");
        DB::statement("ALTER TABLE paiements ADD CONSTRAINT paiements_methode_check CHECK (methode IN ('wave', 'orange_money', 'free_money', 'carte_bancaire'))");
        DB::statement('ALTER TABLE paiements ADD CONSTRAINT paiements_montant_check CHECK (montant > 0)');
        // Un bail règle les loyers et la caution, une promesse son indemnité (associations du diagramme).
        DB::statement("ALTER TABLE paiements ADD CONSTRAINT paiements_cible_check CHECK ((type = 'indemnite' AND promesse_id IS NOT NULL) OR (type <> 'indemnite' AND contrat_id IS NOT NULL))");
    }

    private function retirerAnciennesColonnes(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('payeur_id');
            $table->dropConstrainedForeignId('beneficiaire_id');
            $table->dropColumn(['token_paytech', 'date_paiement', 'periode']);
            $table->renameColumn('contrat_id', 'bail_id');
        });
    }

    private function creerRecus(): void
    {
        Schema::create('recus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paiement_id')->unique()->constrained('paiements')->cascadeOnDelete();
            $table->string('numero')->unique();
            $table->string('document_url')->nullable();
            $table->timestamp('emis_le');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recus');
        foreach (['type', 'statut', 'methode', 'montant', 'cible'] as $nom) {
            DB::statement("ALTER TABLE paiements DROP CONSTRAINT IF EXISTS paiements_{$nom}_check");
        }
        Schema::table('paiements', function (Blueprint $table) {
            $table->renameColumn('bail_id', 'contrat_id');
            $table->foreignId('payeur_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->foreignId('beneficiaire_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('token_paytech')->nullable();
            $table->timestamp('date_paiement')->nullable();
            $table->string('periode', 7)->nullable();
        });
        DB::statement('UPDATE paiements SET token_paytech = reference_paytech, date_paiement = confirme_le');
        DB::statement("UPDATE paiements SET periode = to_char(mois_concerne, 'YYYY-MM') WHERE mois_concerne IS NOT NULL");
        DB::statement("UPDATE paiements SET statut = 'confirme' WHERE statut = 'reussi'");
        DB::statement('ALTER TABLE paiements ALTER COLUMN montant TYPE numeric(15,2)');
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('regle_commission_id');
            $table->dropColumn(['frais_service', 'commission', 'reference_paytech', 'confirme_le', 'mois_concerne', 'restituable']);
        });
        Schema::dropIfExists('regles_commission');
    }
};
