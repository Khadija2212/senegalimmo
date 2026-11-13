<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demandes_location', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bien_id')->constrained('biens')->onDelete('cascade');
            $table->foreignId('locataire_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('proprietaire_id')->constrained('users')->onDelete('cascade');
            $table->text('message')->nullable();
            $table->date('date_emmenagement')->nullable();
            $table->enum('statut', ['en_attente', 'acceptee', 'refusee', 'annulee'])->default('en_attente');
            $table->text('motif_refus')->nullable();
            $table->timestamps();
        });

        Schema::table('contrats', function (Blueprint $table) {
            $table->foreignId('demande_id')->nullable()->constrained('demandes_location')->nullOnDelete();
            $table->unsignedSmallInteger('duree_mois')->nullable();
            $table->timestamp('signe_proprietaire_le')->nullable();
            $table->timestamp('signe_locataire_le')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('contrats', function (Blueprint $table) {
            $table->dropConstrainedForeignId('demande_id');
            $table->dropColumn(['duree_mois', 'signe_proprietaire_le', 'signe_locataire_le']);
        });

        Schema::dropIfExists('demandes_location');
    }
};