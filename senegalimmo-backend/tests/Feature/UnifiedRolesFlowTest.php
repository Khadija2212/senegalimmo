<?php

namespace Tests\Feature;

use App\Models\Bien;
use App\Models\Commission;
use App\Models\Contrat;
use App\Models\DemandeLocation;
use App\Models\Favori;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class UnifiedRolesFlowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropAllTables();

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('prenom');
            $table->string('email')->unique();
            $table->string('telephone')->nullable();
            $table->string('adresse')->nullable();
            $table->string('password');
            $table->string('role')->default('client');
            $table->string('photo')->nullable();
            $table->boolean('est_verifie')->default(false);
            $table->decimal('solde_portefeuille', 15, 2)->default(0);
            $table->string('devise')->default('FCFA');
            $table->boolean('mode_diaspora')->default(false);
            $table->string('statut')->default('actif');
            $table->unsignedBigInteger('agence_id')->nullable();
            $table->string('nom_agence')->nullable();
            $table->string('numero_licence')->nullable();
            $table->string('matricule')->nullable();
            $table->string('niveau')->nullable();
            $table->string('document_identite')->nullable();
            $table->string('verification')->default('non_soumis');
            $table->text('verification_motif')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('biens', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('proprietaire_id');
            $table->unsignedBigInteger('categorie_id')->nullable();
            $table->string('titre');
            $table->text('description');
            $table->string('type');
            $table->string('transaction');
            $table->decimal('prix', 15, 2);
            $table->string('surface')->nullable();
            $table->integer('chambres')->nullable();
            $table->integer('salles_bain')->nullable();
            $table->string('adresse');
            $table->string('quartier');
            $table->string('ville');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->json('photos')->nullable();
            $table->boolean('est_verifie')->default(false);
            $table->string('statut')->default('disponible');
            $table->timestamps();
        });

        Schema::create('annonces', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bien_id');
            $table->unsignedBigInteger('auteur_id');
            $table->string('titre');
            $table->text('description');
            $table->decimal('prix', 15, 2);
            $table->json('photos')->nullable();
            $table->string('type_transaction');
            $table->string('statut')->default('en_attente');
            $table->boolean('bien_verifie')->default(false);
            $table->integer('nombre_vues')->default(0);
            $table->timestamp('date_expiration')->nullable();
            $table->text('motif_rejet')->nullable();
            $table->timestamps();
        });

        Schema::create('favoris', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('bien_id');
            $table->timestamps();
        });

        Schema::create('demandes_location', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bien_id');
            $table->unsignedBigInteger('locataire_id');
            $table->unsignedBigInteger('proprietaire_id');
            $table->text('message')->nullable();
            $table->date('date_emmenagement')->nullable();
            $table->string('statut')->default('en_attente');
            $table->text('motif_refus')->nullable();
            $table->timestamps();
        });

        Schema::create('contrats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bien_id');
            $table->unsignedBigInteger('demande_id')->nullable();
            $table->unsignedBigInteger('proprietaire_id');
            $table->unsignedBigInteger('locataire_id');
            $table->string('type');
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->unsignedSmallInteger('duree_mois')->nullable();
            $table->decimal('loyer_mensuel', 15, 2)->nullable();
            $table->decimal('caution', 15, 2)->nullable();
            $table->decimal('prix_vente', 15, 2)->nullable();
            $table->string('fichier_pdf')->nullable();
            $table->string('statut')->default('en_attente');
            $table->boolean('signe_proprietaire')->default(false);
            $table->boolean('signe_locataire')->default(false);
            $table->timestamp('signe_proprietaire_le')->nullable();
            $table->timestamp('signe_locataire_le')->nullable();
            $table->timestamps();
        });

        Schema::create('visites', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bien_id');
            $table->unsignedBigInteger('demandeur_id');
            $table->unsignedBigInteger('proprietaire_id');
            $table->unsignedBigInteger('agent_id')->nullable();
            $table->dateTime('date_visite');
            $table->string('statut')->default('en_attente');
            $table->text('commentaire')->nullable();
            $table->text('compte_rendu')->nullable();
            $table->timestamps();
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('expediteur_id');
            $table->unsignedBigInteger('destinataire_id');
            $table->unsignedBigInteger('bien_id')->nullable();
            $table->text('contenu');
            $table->boolean('lu')->default(false);
            $table->timestamps();
        });

        Schema::create('offres_achat', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bien_id');
            $table->unsignedBigInteger('acheteur_id');
            $table->unsignedBigInteger('proprietaire_id');
            $table->decimal('montant_offre', 15, 2);
            $table->decimal('montant_contre', 15, 2)->nullable();
            $table->decimal('montant_final', 15, 2)->nullable();
            $table->text('message')->nullable();
            $table->string('statut')->default('en_attente');
            $table->text('motif_refus')->nullable();
            $table->timestamps();
        });

        Schema::create('promesses_vente', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('offre_id');
            $table->unsignedBigInteger('bien_id');
            $table->unsignedBigInteger('vendeur_id');
            $table->unsignedBigInteger('acheteur_id');
            $table->decimal('prix_convenu', 15, 2);
            $table->decimal('indemnite_immobilisation', 15, 2)->default(0);
            $table->date('date_limite');
            $table->text('conditions')->nullable();
            $table->string('statut')->default('en_attente');
            $table->boolean('signe_vendeur')->default(false);
            $table->boolean('signe_acheteur')->default(false);
            $table->timestamp('signe_vendeur_le')->nullable();
            $table->timestamp('signe_acheteur_le')->nullable();
            $table->timestamps();
        });

        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('contrat_id')->nullable();
            $table->unsignedBigInteger('promesse_id')->nullable();
            $table->unsignedBigInteger('payeur_id');
            $table->unsignedBigInteger('beneficiaire_id');
            $table->decimal('montant', 15, 2);
            $table->string('methode');
            $table->string('type');
            $table->string('reference')->unique();
            $table->string('statut')->default('en_attente');
            $table->timestamp('date_paiement')->nullable();
            $table->timestamps();
        });

        Schema::create('mandats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bien_id');
            $table->unsignedBigInteger('proprietaire_id');
            $table->unsignedBigInteger('agence_id');
            $table->unsignedBigInteger('agent_id')->nullable();
            $table->string('type');
            $table->decimal('commission_pct', 5, 2);
            $table->date('date_debut');
            $table->date('date_fin');
            $table->string('statut')->default('propose');
            $table->text('motif_refus')->nullable();
            $table->timestamps();
        });

        Schema::create('commissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('mandat_id');
            $table->unsignedBigInteger('bien_id');
            $table->unsignedBigInteger('agence_id');
            $table->unsignedBigInteger('agent_id')->nullable();
            $table->unsignedBigInteger('proprietaire_id');
            $table->unsignedBigInteger('contrat_id')->nullable();
            $table->unsignedBigInteger('promesse_id')->nullable();
            $table->string('type');
            $table->decimal('base', 15, 2);
            $table->decimal('taux', 5, 2);
            $table->decimal('montant', 15, 2);
            $table->string('statut')->default('due');
            $table->timestamp('reglee_le')->nullable();
            $table->timestamps();
        });

        Schema::create('demandes_retrait', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->decimal('montant', 15, 2);
            $table->string('methode')->default('wave');
            $table->string('numero_telephone');
            $table->string('statut')->default('en_attente');
            $table->text('motif_rejet')->nullable();
            $table->timestamp('traitee_le')->nullable();
            $table->string('preuve')->nullable();
            $table->string('reference_transfert')->nullable();
            $table->timestamps();
        });

        Schema::create('mouvements_portefeuille', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('type');
            $table->decimal('montant', 15, 2);
            $table->decimal('solde_apres', 15, 2);
            $table->string('libelle');
            $table->timestamps();
        });

        Schema::create('alertes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('titre');
            $table->text('message');
            $table->string('lien')->nullable();
            $table->boolean('lue')->default(false);
            $table->timestamps();
        });
    }

    private function makeUser(string $role, array $overrides = []): User
    {
        return User::create(array_merge([
            'nom' => ucfirst($role),
            'prenom' => 'Test',
            'email' => $role.'_'.uniqid().'@test.sn',
            'telephone' => '771234567',
            'password' => Hash::make('secret123'),
            'role' => $role,
            'statut' => 'actif',
            'solde_portefeuille' => 0,
        ], $overrides));
    }

    private function makeBien(User $proprietaire): Bien
    {
        return Bien::create([
            'proprietaire_id' => $proprietaire->id,
            'titre' => 'Appartement Plateau',
            'description' => 'Bel appartement lumineux',
            'type' => 'appartement',
            'transaction' => 'location',
            'prix' => 350000,
            'adresse' => '10 Avenue Léopold Sédar Senghor',
            'quartier' => 'Plateau',
            'ville' => 'Dakar',
            'statut' => 'disponible',
        ]);
    }

    public function test_client_stats_endpoint_succeeds(): void
    {
        $proprio = $this->makeUser('proprietaire');
        $client = $this->makeUser('client');
        $bien = $this->makeBien($proprio);

        Favori::create([
            'user_id' => $client->id,
            'bien_id' => $bien->id,
        ]);

        DemandeLocation::create([
            'bien_id' => $bien->id,
            'locataire_id' => $client->id,
            'proprietaire_id' => $proprio->id,
            'statut' => 'en_attente',
        ]);

        Contrat::create([
            'bien_id' => $bien->id,
            'proprietaire_id' => $proprio->id,
            'locataire_id' => $client->id,
            'type' => 'bail',
            'date_debut' => now()->toDateString(),
            'loyer_mensuel' => 350000,
            'statut' => 'signe',
            'signe_proprietaire' => true,
            'signe_locataire' => true,
        ]);

        $response = $this->actingAs($client)->getJson('/api/stats');

        $response->assertOk()
            ->assertJsonFragment([
                'favoris' => 1,
                'demandes_location' => 1,
                'baux_actifs' => 1,
            ]);
    }

    public function test_agent_can_access_portefeuille_and_submit_retraits(): void
    {
        $agent = $this->makeUser('agent', ['solde_portefeuille' => 150000]);

        $this->actingAs($agent)
            ->getJson('/api/portefeuille')
            ->assertOk()
            ->assertJsonPath('solde', 150000);

        $this->actingAs($agent)
            ->postJson('/api/retraits', [
                'montant' => 50000,
                'methode' => 'wave',
                'numero_telephone' => '771234567',
            ])
            ->assertStatus(201);

        $this->actingAs($agent)
            ->postJson('/api/demandes-retrait', [
                'montant' => 25000,
                'methode' => 'orange_money',
                'numero_telephone' => '771234567',
            ])
            ->assertStatus(201);
    }

    public function test_agent_mandat_commission_annonce_and_visite_flow(): void
    {
        $proprio = $this->makeUser('proprietaire', ['solde_portefeuille' => 500000]);
        $agent = $this->makeUser('agent', ['solde_portefeuille' => 0]);
        $client = $this->makeUser('client');
        $bien = $this->makeBien($proprio);

        $this->actingAs($proprio)
            ->getJson('/api/agences')
            ->assertOk()
            ->assertJsonFragment(['id' => $agent->id]);

        $mandatResponse = $this->actingAs($proprio)
            ->postJson('/api/mandats', [
                'bien_id' => $bien->id,
                'agence_id' => $agent->id,
                'type' => 'exclusif',
                'commission_pct' => 10,
                'date_debut' => now()->toDateString(),
                'date_fin' => now()->addMonths(6)->toDateString(),
            ]);

        $mandatResponse->assertStatus(201);
        $mandatId = $mandatResponse->json('mandat.id') ?? $mandatResponse->json('id');

        $this->assertDatabaseHas('mandats', [
            'id' => $mandatId,
            'agence_id' => $agent->id,
            'agent_id' => $agent->id,
        ]);

        $this->actingAs($agent)
            ->putJson("/api/mandats/{$mandatId}", ['action' => 'accepter'])
            ->assertOk();

        $this->actingAs($agent)
            ->getJson('/api/mandats')
            ->assertOk()
            ->assertJsonFragment(['id' => $mandatId]);

        $this->actingAs($agent)
            ->getJson('/api/biens-geres')
            ->assertOk()
            ->assertJsonFragment(['id' => $bien->id]);

        $this->actingAs($agent)
            ->getJson('/api/stats')
            ->assertOk()
            ->assertJsonPath('biens_assignes', 1);

        $this->actingAs($agent)
            ->postJson('/api/annonces', [
                'bien_id' => $bien->id,
                'titre' => 'Superbe appartement Plateau',
                'description' => 'Disponible immédiatement',
                'prix' => 350000,
                'type_transaction' => 'location',
            ])
            ->assertStatus(201);

        $visiteResponse = $this->actingAs($client)
            ->postJson('/api/visites', [
                'bien_id' => $bien->id,
                'date_visite' => now()->addDays(2)->format('Y-m-d H:i:s'),
                'commentaire' => 'Disponible l\'après-midi',
            ]);

        $visiteResponse->assertStatus(201);
        $this->assertDatabaseHas('visites', [
            'bien_id' => $bien->id,
            'agent_id' => $agent->id,
        ]);

        $commission = Commission::create([
            'mandat_id' => $mandatId,
            'bien_id' => $bien->id,
            'agence_id' => $agent->id,
            'agent_id' => $agent->id,
            'proprietaire_id' => $proprio->id,
            'type' => 'location',
            'base' => 350000,
            'taux' => 10,
            'montant' => 35000,
            'statut' => 'due',
        ]);

        $this->actingAs($agent)
            ->getJson('/api/commissions')
            ->assertOk()
            ->assertJsonFragment(['id' => $commission->id]);

        $this->actingAs($proprio)
            ->putJson("/api/commissions/{$commission->id}/payer")
            ->assertOk();

        $this->assertDatabaseHas('commissions', [
            'id' => $commission->id,
            'statut' => 'reglee',
        ]);

        $this->assertEquals(35000.0, (float) $agent->fresh()->solde_portefeuille);
        $this->assertEquals(465000.0, (float) $proprio->fresh()->solde_portefeuille);

        $commission2 = Commission::create([
            'mandat_id' => $mandatId,
            'bien_id' => $bien->id,
            'agence_id' => $agent->id,
            'agent_id' => $agent->id,
            'proprietaire_id' => $proprio->id,
            'type' => 'location',
            'base' => 350000,
            'taux' => 10,
            'montant' => 35000,
            'statut' => 'due',
        ]);

        $this->actingAs($agent)
            ->putJson("/api/commissions/{$commission2->id}/regler")
            ->assertOk();

        $this->assertDatabaseHas('commissions', [
            'id' => $commission2->id,
            'statut' => 'reglee',
        ]);
    }

    public function test_locataire_stats_and_favoris_endpoint(): void
    {
        $proprio = $this->makeUser('proprietaire');
        $locataire = $this->makeUser('locataire');
        $bien = $this->makeBien($proprio);

        Favori::create([
            'user_id' => $locataire->id,
            'bien_id' => $bien->id,
        ]);

        $this->actingAs($locataire)
            ->getJson('/api/stats')
            ->assertOk()
            ->assertJsonFragment(['favoris' => 1]);

        $this->actingAs($locataire)
            ->getJson('/api/favoris')
            ->assertOk()
            ->assertJsonFragment([
                'id' => $bien->id,
                'titre' => 'Appartement Plateau',
            ]);
    }

    public function test_agence_role_rejected_on_register_and_unified_for_legacy_users(): void
    {
        $this->postJson('/api/register', [
            'nom' => 'Immo',
            'prenom' => 'Test',
            'email' => 'agence_new@test.sn',
            'telephone' => '770000001',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'role' => 'agence',
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['role']);

        $proprio = $this->makeUser('proprietaire');
        $legacyAgence = $this->makeUser('agence', ['solde_portefeuille' => 90000]);
        $agent = $this->makeUser('agent');
        $admin = $this->makeUser('administrateur');
        $bien = $this->makeBien($proprio);

        $mandatRes = $this->actingAs($proprio)
            ->postJson('/api/mandats', [
                'bien_id' => $bien->id,
                'agence_id' => $legacyAgence->id,
                'type' => 'exclusif',
                'commission_pct' => 8,
                'date_debut' => now()->toDateString(),
                'date_fin' => now()->addMonths(3)->toDateString(),
            ])
            ->assertStatus(201);

        $mandatId = $mandatRes->json('id');
        $this->assertDatabaseHas('mandats', [
            'id' => $mandatId,
            'agence_id' => $legacyAgence->id,
            'agent_id' => $legacyAgence->id,
        ]);

        $this->actingAs($legacyAgence)
            ->getJson('/api/stats')
            ->assertOk()
            ->assertJsonFragment([
                'mandats_en_attente' => 1,
                'solde' => 90000,
            ]);

        $this->actingAs($legacyAgence)
            ->putJson("/api/mandats/{$mandatId}", ['action' => 'accepter'])
            ->assertOk();

        $this->actingAs($legacyAgence)
            ->getJson('/api/biens-geres')
            ->assertOk()
            ->assertJsonFragment(['id' => $mandatId]);

        $this->actingAs($legacyAgence)
            ->postJson('/api/agents', [
                'nom' => 'Sub',
                'prenom' => 'Agent',
                'email' => 'sub@test.sn',
                'telephone' => '771112233',
                'password' => 'secret123',
            ])
            ->assertStatus(403);

        Commission::create([
            'mandat_id' => $mandatId,
            'bien_id' => $bien->id,
            'agence_id' => $legacyAgence->id,
            'agent_id' => $legacyAgence->id,
            'proprietaire_id' => $proprio->id,
            'type' => 'location',
            'base' => 350000,
            'taux' => 8,
            'montant' => 28000,
            'statut' => 'due',
        ]);

        $this->assertSame(
            1,
            \App\Models\Alerte::where('user_id', $legacyAgence->id)
                ->where('titre', 'Commission générée')
                ->count()
        );

        $this->actingAs($admin)
            ->getJson('/api/admin/utilisateurs?role=agent')
            ->assertOk()
            ->assertJsonFragment(['id' => $agent->id])
            ->assertJsonFragment(['id' => $legacyAgence->id]);
    }
}
