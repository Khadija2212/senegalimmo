<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contrats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bien_id')->constrained('biens')->onDelete('cascade');
            $table->foreignId('proprietaire_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('locataire_id')->constrained('users')->onDelete('cascade');
            $table->enum('type', ['bail', 'vente']);
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->decimal('loyer_mensuel', 15, 2)->nullable();
            $table->decimal('caution', 15, 2)->nullable();
            $table->decimal('prix_vente', 15, 2)->nullable();
            $table->string('fichier_pdf')->nullable();
            $table->enum('statut', ['en_attente', 'signe', 'resilie', 'expire'])->default('en_attente');
            $table->boolean('signe_proprietaire')->default(false);
            $table->boolean('signe_locataire')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contrats');
    }
};