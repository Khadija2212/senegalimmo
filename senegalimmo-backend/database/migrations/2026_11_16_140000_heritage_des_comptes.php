<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Héritage Compte, Utilisateur, Client, Proprietaire, Agent, Administrateur du diagramme.
 * Une seule table « users » : le rôle désigne la classe concrète (énumération Role, 4 valeurs).
 * Les anciens rôles locataire et acheteur deviennent client, agence devient agent.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
        DB::statement("UPDATE users SET role = 'client' WHERE role IN ('locataire', 'acheteur')");
        DB::statement("UPDATE users SET role = 'agent' WHERE role = 'agence'");
        DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'client'");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('client', 'proprietaire', 'agent', 'administrateur'))");

        DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_statut_check');
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_statut_check CHECK (statut IN ('actif', 'suspendu', 'supprime'))");

        Schema::table('users', function (Blueprint $t) {
            // Utilisateur
            $t->boolean('telephone_verifie')->default(false);
            $t->boolean('email_verifie')->default(false);
            $t->timestamp('derniere_connexion')->nullable();
            // Client
            $t->date('date_naissance')->nullable();
            // Agent
            $t->timestamp('valide_le')->nullable();
        });

        DB::statement("UPDATE users SET niveau = 'super_admin' WHERE role = 'administrateur' AND (niveau IS NULL OR niveau NOT IN ('moderateur', 'finance', 'super_admin'))");
        DB::statement("UPDATE users SET niveau = NULL WHERE role <> 'administrateur'");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_niveau_check CHECK ((role = 'administrateur' AND niveau IN ('moderateur', 'finance', 'super_admin')) OR (role <> 'administrateur' AND niveau IS NULL))");
    }

    public function down(): void
    {
        foreach (['role', 'statut', 'niveau'] as $c) {
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_{$c}_check");
        }
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn(['telephone_verifie', 'email_verifie', 'derniere_connexion', 'date_naissance', 'valide_le']));
        DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'locataire'");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('client', 'proprietaire', 'locataire', 'acheteur', 'agence', 'agent', 'administrateur'))");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_statut_check CHECK (statut IN ('actif', 'suspendu'))");
    }
};
