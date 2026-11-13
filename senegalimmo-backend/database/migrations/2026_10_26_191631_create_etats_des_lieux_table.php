<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('etats_des_lieux', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contrat_id')->constrained('contrats')->onDelete('cascade');
            $table->enum('type', ['entree', 'sortie']);
            $table->json('pieces');
            $table->text('observations')->nullable();
            $table->json('photos')->nullable();
            $table->boolean('valide_locataire')->default(false);
            $table->timestamp('valide_le')->nullable();
            $table->text('remarque_locataire')->nullable();
            $table->timestamps();

            $table->unique(['contrat_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('etats_des_lieux');
    }
};