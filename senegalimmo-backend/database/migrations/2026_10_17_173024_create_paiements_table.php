<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contrat_id')->nullable()->constrained('contrats')->onDelete('set null');
            $table->foreignId('payeur_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('beneficiaire_id')->constrained('users')->onDelete('cascade');
            $table->decimal('montant', 15, 2);
            $table->enum('methode', ['orange_money', 'wave', 'free_money']);
            $table->enum('type', ['loyer', 'caution', 'achat', 'retrait']);
            $table->string('reference')->unique();
            $table->enum('statut', ['en_attente', 'confirme', 'echoue'])->default('en_attente');
            $table->timestamp('date_paiement')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};