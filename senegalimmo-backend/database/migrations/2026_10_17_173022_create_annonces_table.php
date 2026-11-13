<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('annonces', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bien_id')->constrained('biens')->onDelete('cascade');
            $table->foreignId('auteur_id')->constrained('users')->onDelete('cascade');
            $table->string('titre');
            $table->text('description');
            $table->decimal('prix', 15, 2);
            $table->json('photos')->nullable();
            $table->enum('type_transaction', ['location', 'vente']);
            $table->enum('statut', ['en_attente', 'publiee', 'rejetee', 'expiree'])->default('en_attente');
            $table->boolean('bien_verifie')->default(false);
            $table->integer('nombre_vues')->default(0);
            $table->timestamp('date_expiration')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('annonces');
    }
};