<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('prenom');
            $table->string('email')->unique();
            $table->string('telephone')->nullable();
            $table->string('adresse')->nullable();
            $table->string('password');
            $table->enum('role', [
                'proprietaire',
                'locataire',
                'acheteur',
                'agence',
                'administrateur'
            ])->default('locataire');
            $table->string('photo')->nullable();
            $table->boolean('est_verifie')->default(false);
            $table->decimal('solde_portefeuille', 15, 2)->default(0);
            $table->string('devise')->default('FCFA');
            $table->boolean('mode_diaspora')->default(false);
            $table->enum('statut', ['actif', 'suspendu'])->default('actif');
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};