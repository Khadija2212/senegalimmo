<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Attribut motifRefus de DemandeLocation et d'OffreAchat, comme celui de Visite. */
return new class extends Migration
{
    private const TABLES = ['demandes_location', 'offres_achat'];

    public function up(): void
    {
        foreach (self::TABLES as $nom) {
            Schema::table($nom, function (Blueprint $table) {
                $table->text('motif_refus')->nullable()->after('statut');
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $nom) {
            Schema::table($nom, function (Blueprint $table) {
                $table->dropColumn('motif_refus');
            });
        }
    }
};
