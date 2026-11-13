<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('mouvements_portefeuille')) {
            Schema::create('mouvements_portefeuille', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->enum('type', ['credit', 'debit']);
                $table->decimal('montant', 15, 2);
                $table->decimal('solde_apres', 15, 2);
                $table->string('libelle');
                $table->timestamps();
                $table->index(['user_id', 'created_at']);
            });
        }

        if (!Schema::hasColumn('demandes_retrait', 'preuve')) {
            Schema::table('demandes_retrait', function (Blueprint $table) {
                $table->string('preuve')->nullable();
            });
        }

        if (!Schema::hasColumn('demandes_retrait', 'reference_transfert')) {
            Schema::table('demandes_retrait', function (Blueprint $table) {
                $table->string('reference_transfert')->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('mouvements_portefeuille');

        foreach (['preuve', 'reference_transfert'] as $colonne) {
            if (Schema::hasColumn('demandes_retrait', $colonne)) {
                Schema::table('demandes_retrait', fn (Blueprint $table) => $table->dropColumn($colonne));
            }
        }
    }
};