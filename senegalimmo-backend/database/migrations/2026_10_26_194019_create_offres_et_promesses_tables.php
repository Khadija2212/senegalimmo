<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('offres_achat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bien_id')->constrained('biens')->onDelete('cascade');
            $table->foreignId('acheteur_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('proprietaire_id')->constrained('users')->onDelete('cascade');
            $table->decimal('montant_offre', 15, 2);
            $table->decimal('montant_contre', 15, 2)->nullable();
            $table->decimal('montant_final', 15, 2)->nullable();
            $table->text('message')->nullable();
            $table->enum('statut', ['en_attente', 'contre_proposee', 'acceptee', 'refusee', 'annulee'])
                ->default('en_attente');
            $table->text('motif_refus')->nullable();
            $table->timestamps();
        });

        Schema::create('promesses_vente', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offre_id')->unique()->constrained('offres_achat')->onDelete('cascade');
            $table->foreignId('bien_id')->constrained('biens')->onDelete('cascade');
            $table->foreignId('vendeur_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('acheteur_id')->constrained('users')->onDelete('cascade');
            $table->decimal('prix_convenu', 15, 2);
            $table->decimal('indemnite_immobilisation', 15, 2)->default(0);
            $table->date('date_limite');
            $table->text('conditions')->nullable();
            $table->enum('statut', ['en_attente', 'signee', 'annulee'])->default('en_attente');
            $table->boolean('signe_vendeur')->default(false);
            $table->boolean('signe_acheteur')->default(false);
            $table->timestamp('signe_vendeur_le')->nullable();
            $table->timestamp('signe_acheteur_le')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promesses_vente');
        Schema::dropIfExists('offres_achat');
    }
};