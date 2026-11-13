<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proprietaire_id')->constrained('users')->onDelete('cascade');
            $table->string('titre');
            $table->text('description');
            $table->enum('type', ['appartement', 'villa', 'bureau', 'terrain', 'studio']);
            $table->enum('transaction', ['location', 'vente']);
            $table->decimal('prix', 15, 2);
            $table->string('surface')->nullable();
            $table->integer('chambres')->nullable();
            $table->integer('salles_bain')->nullable();
            $table->string('adresse');
            $table->string('quartier');
            $table->string('ville');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('est_verifie')->default(false);
            $table->enum('statut', ['disponible', 'loue', 'vendu', 'indisponible'])->default('disponible');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biens');
    }
};