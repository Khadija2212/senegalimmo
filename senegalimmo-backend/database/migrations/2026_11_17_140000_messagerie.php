<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Paquet Messagerie : Conversation (2..* participants, 0..1 Annonce) composée de Messages. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('annonce_id')->nullable()->constrained('annonces')->nullOnDelete();
            $table->timestamp('dernier_message_le')->nullable();
            $table->timestamps();
        });

        Schema::create('conversation_participants', function (Blueprint $table) {
            $table->foreignUuid('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignUuid('utilisateur_id')->constrained('users')->cascadeOnDelete();
            $table->primary(['conversation_id', 'utilisateur_id']);
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignUuid('expediteur_id')->constrained('users')->cascadeOnDelete();
            $table->text('contenu');
            $table->string('piece_jointe_url')->nullable();
            $table->timestamp('envoye_le');
            $table->timestamp('lu_le')->nullable();
            $table->timestamps();
            $table->index(['conversation_id', 'envoye_le']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversation_participants');
        Schema::dropIfExists('conversations');
    }
};
