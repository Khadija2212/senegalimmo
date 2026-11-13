<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('alertes')) {
            Schema::create('alertes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->string('titre');
                $table->text('message');
                $table->string('lien')->nullable();
                $table->boolean('lue')->default(false);
                $table->timestamps();
                $table->index(['user_id', 'lue']);
            });
        }

        // Chaque colonne n'est ajoutée que si elle n'existe pas déjà
        $colonnes = [
            'numero_cni'         => fn (Blueprint $t) => $t->string('numero_cni')->nullable(),
            'profession'         => fn (Blueprint $t) => $t->string('profession')->nullable(),
            'revenu_mensuel'     => fn (Blueprint $t) => $t->decimal('revenu_mensuel', 15, 2)->nullable(),
            'budget_min'         => fn (Blueprint $t) => $t->decimal('budget_min', 15, 2)->nullable(),
            'budget_max'         => fn (Blueprint $t) => $t->decimal('budget_max', 15, 2)->nullable(),
            'nom_agence'         => fn (Blueprint $t) => $t->string('nom_agence')->nullable(),
            'numero_licence'     => fn (Blueprint $t) => $t->string('numero_licence')->nullable(),
            'matricule'          => fn (Blueprint $t) => $t->string('matricule')->nullable(),
            'document_identite'  => fn (Blueprint $t) => $t->string('document_identite')->nullable(),
            'verification'       => fn (Blueprint $t) => $t->string('verification')->default('non_soumis'),
            'verification_motif' => fn (Blueprint $t) => $t->text('verification_motif')->nullable(),
        ];

        foreach ($colonnes as $nom => $definition) {
            if (!Schema::hasColumn('users', $nom)) {
                Schema::table('users', fn (Blueprint $table) => $definition($table));
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('alertes');

        foreach (['verification', 'verification_motif', 'document_identite', 'matricule'] as $colonne) {
            if (Schema::hasColumn('users', $colonne)) {
                Schema::table('users', fn (Blueprint $table) => $table->dropColumn($colonne));
            }
        }
    }
};