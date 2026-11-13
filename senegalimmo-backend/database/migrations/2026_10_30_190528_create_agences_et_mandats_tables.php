<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Nouveau rôle « agent » dans la contrainte de la colonne role
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['proprietaire','locataire','acheteur','agence','agent','administrateur']::text[]))");

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('agence_id')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::create('mandats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bien_id')->constrained('biens')->onDelete('cascade');
            $table->foreignId('proprietaire_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('agence_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['simple', 'exclusif']);
            $table->decimal('commission_pct', 5, 2);
            $table->date('date_debut');
            $table->date('date_fin');
            $table->enum('statut', ['propose', 'actif', 'refuse', 'resilie', 'annule', 'expire'])->default('propose');
            $table->text('motif_refus')->nullable();
            $table->timestamps();
        });

        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mandat_id')->constrained('mandats')->onDelete('cascade');
            $table->foreignId('bien_id')->constrained('biens')->onDelete('cascade');
            $table->foreignId('agence_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('agent_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('proprietaire_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('contrat_id')->nullable()->constrained('contrats')->nullOnDelete();
            $table->foreignId('promesse_id')->nullable()->constrained('promesses_vente')->nullOnDelete();
            $table->enum('type', ['location', 'vente']);
            $table->decimal('base', 15, 2);
            $table->decimal('taux', 5, 2);
            $table->decimal('montant', 15, 2);
            $table->enum('statut', ['due', 'reglee'])->default('due');
            $table->timestamp('reglee_le')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commissions');
        Schema::dropIfExists('mandats');

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('agence_id');
        });

        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['proprietaire','locataire','acheteur','agence','administrateur']::text[]))");
    }
};