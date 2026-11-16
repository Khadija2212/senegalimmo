<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Portefeuille, Ecriture et Retrait du diagramme de classes.
 * Le solde quitte users pour un Portefeuille à deux soldes (disponible, en attente),
 * l'historique devient des Ecritures typées, demandes_retrait devient retraits.
 */
return new class extends Migration
{
    private const ROLES_AVEC_PORTEFEUILLE = "('proprietaire', 'agent', 'agence')";

    public function up(): void
    {
        $this->creerTables();
        $this->reprendrePortefeuilles();
        $this->reprendreEcritures();
        $this->reprendreRetraits();

        Schema::drop('mouvements_portefeuille');
        Schema::drop('demandes_retrait');
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('solde_portefeuille'));
    }

    private function creerTables(): void
    {
        Schema::create('portefeuilles', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $t->bigInteger('solde_disponible')->default(0);
            $t->bigInteger('solde_en_attente')->default(0);
            $t->timestamp('mis_a_jour_le')->nullable();
            $t->timestamps();
        });
        DB::statement('ALTER TABLE portefeuilles ADD CONSTRAINT portefeuilles_soldes_check CHECK (solde_disponible >= 0 AND solde_en_attente >= 0)');

        Schema::create('retraits', function (Blueprint $t) {
            $t->id();
            $t->foreignId('portefeuille_id')->constrained('portefeuilles')->cascadeOnDelete();
            $t->bigInteger('montant');
            $t->string('methode');
            $t->string('numero_beneficiaire', 30);
            $t->string('statut')->default('demande');
            $t->string('reference_paytech')->nullable()->index();
            $t->text('motif_rejet')->nullable();
            $t->foreignId('validateur_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('demande_le');
            $t->timestamp('traite_le')->nullable();
            $t->timestamps();
        });
        DB::statement("ALTER TABLE retraits ADD CONSTRAINT retraits_statut_check CHECK (statut IN ('demande', 'approuve', 'verse', 'rejete'))");
        DB::statement("ALTER TABLE retraits ADD CONSTRAINT retraits_methode_check CHECK (methode IN ('wave', 'orange_money', 'free_money'))");
        DB::statement('ALTER TABLE retraits ADD CONSTRAINT retraits_montant_check CHECK (montant > 0)');

        Schema::create('ecritures', function (Blueprint $t) {
            $t->id();
            $t->foreignId('portefeuille_id')->constrained('portefeuilles')->cascadeOnDelete();
            $t->string('type');
            $t->bigInteger('montant');
            $t->bigInteger('solde_apres');
            $t->string('libelle');
            $t->timestamp('date');
            $t->foreignId('paiement_id')->nullable()->constrained('paiements')->nullOnDelete();
            $t->foreignId('retrait_id')->nullable()->constrained('retraits')->nullOnDelete();
            $t->timestamps();
            $t->index(['portefeuille_id', 'date']);
        });
        DB::statement("ALTER TABLE ecritures ADD CONSTRAINT ecritures_type_check CHECK (type IN ('credit_loyer', 'credit_vente', 'commission_agent', 'blocage_retrait', 'debit_retrait', 'deblocage'))");
    }

    private function reprendrePortefeuilles(): void
    {
        // Les demandes en attente étaient déjà débitées : elles passent dans le solde en attente.
        DB::statement('INSERT INTO portefeuilles (user_id, solde_disponible, solde_en_attente, mis_a_jour_le, created_at, updated_at)
            SELECT u.id, round(u.solde_portefeuille),
                   COALESCE((SELECT round(sum(d.montant)) FROM demandes_retrait d WHERE d.user_id = u.id AND d.statut = \'en_attente\'), 0),
                   now(), now(), now()
            FROM users u WHERE u.role IN ' . self::ROLES_AVEC_PORTEFEUILLE . ' OR u.solde_portefeuille > 0');
    }

    private function reprendreEcritures(): void
    {
        DB::statement("INSERT INTO ecritures (portefeuille_id, type, montant, solde_apres, libelle, date, created_at, updated_at)
            SELECT p.id,
                   CASE WHEN m.libelle ILIKE '%commission%' THEN 'commission_agent'
                        WHEN m.type = 'debit' THEN 'blocage_retrait'
                        WHEN m.libelle ILIKE '%rembours%' THEN 'deblocage'
                        WHEN m.libelle ILIKE '%indemnit%' OR m.libelle ILIKE '%vente%' THEN 'credit_vente'
                        ELSE 'credit_loyer' END,
                   CASE WHEN m.type = 'debit' THEN -round(m.montant) ELSE round(m.montant) END,
                   round(m.solde_apres), m.libelle, m.created_at, m.created_at, m.updated_at
            FROM mouvements_portefeuille m JOIN portefeuilles p ON p.user_id = m.user_id");
    }

    private function reprendreRetraits(): void
    {
        // Le virement bancaire n'existe pas dans MethodePaiement : ces anciennes demandes ne sont pas reprises.
        DB::statement("INSERT INTO retraits (portefeuille_id, montant, methode, numero_beneficiaire, statut, reference_paytech, motif_rejet, demande_le, traite_le, created_at, updated_at)
            SELECT p.id, round(d.montant), d.methode, d.numero_telephone,
                   CASE d.statut WHEN 'en_attente' THEN 'demande' WHEN 'validee' THEN 'verse' ELSE 'rejete' END,
                   d.reference_transfert, d.motif_rejet, d.created_at, d.traitee_le, d.created_at, d.updated_at
            FROM demandes_retrait d JOIN portefeuilles p ON p.user_id = d.user_id
            WHERE d.methode <> 'virement'");
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $t) => $t->decimal('solde_portefeuille', 15, 2)->default(0));
        DB::statement('UPDATE users u SET solde_portefeuille = p.solde_disponible FROM portefeuilles p WHERE p.user_id = u.id');

        Schema::create('mouvements_portefeuille', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $t->enum('type', ['credit', 'debit']);
            $t->decimal('montant', 15, 2);
            $t->decimal('solde_apres', 15, 2);
            $t->string('libelle');
            $t->timestamps();
            $t->index(['user_id', 'created_at']);
        });
        Schema::create('demandes_retrait', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $t->decimal('montant', 15, 2);
            $t->enum('methode', ['wave', 'orange_money', 'virement'])->default('wave');
            $t->string('numero_telephone');
            $t->enum('statut', ['en_attente', 'validee', 'rejetee'])->default('en_attente');
            $t->text('motif_rejet')->nullable();
            $t->timestamp('traitee_le')->nullable();
            $t->string('preuve')->nullable();
            $t->string('reference_transfert')->nullable();
            $t->timestamps();
        });
        Schema::drop('ecritures');
        Schema::drop('retraits');
        Schema::drop('portefeuilles');
    }
};
