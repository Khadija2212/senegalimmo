<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('noteur_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('note_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('bien_id')->nullable()->constrained('biens')->onDelete('set null');
            $table->integer('note')->between(1, 5);
            $table->text('commentaire')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notations');
    }
};