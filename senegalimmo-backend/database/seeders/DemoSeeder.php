<?php

namespace Database\Seeders;

use App\Enums\DecisionModeration;
use App\Enums\RoleAdmin;
use App\Enums\StatutValidation;
use App\Enums\TypeMandat;
use App\Enums\TypeMedia;
use App\Enums\TypeTransaction;
use App\Models\Administrateur;
use App\Models\Agent;
use App\Models\Bien;
use App\Models\Client;
use App\Models\Compte;
use App\Models\Media;
use App\Models\Proprietaire;
use App\Services\Signature\SignatureElectroniqueSimple;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Données de démonstration des maquettes validées : comptes, biens avec photos,
 * annonces publiées et un mandat signé. À lancer en local : php artisan db:seed --class=DemoSeeder
 */
class DemoSeeder extends Seeder
{
    private const MOT_DE_PASSE_DEFAUT = 'Demo@2026';

    private const DOSSIER = __DIR__.'/demo';

    private const TAUX_MANDAT = 5;

    private const ADRESSE_IP = '127.0.0.1';

    /** Clé => [classe, prénom, nom, e-mail, téléphone] */
    private const COMPTES = [
        'awa' => [Proprietaire::class, 'Awa', 'Diop', 'awa.diop@senegalimmo.test', '771112233'],
        'ibrahima' => [Proprietaire::class, 'Ibrahima', 'Ndiaye', 'ibrahima.ndiaye@senegalimmo.test', '772223344'],
        'moussa' => [Agent::class, 'Moussa', 'Sarr', 'moussa.sarr@senegalimmo.test', '773334455'],
        'fatou' => [Client::class, 'Fatou', 'Ba', 'fatou.ba@senegalimmo.test', '774445566'],
    ];

    /** Un administrateur par niveau borné ; le super administrateur vient d'AdminSeeder. [niveau, prénom, nom, e-mail, téléphone] */
    private const ADMINISTRATEURS = [
        [RoleAdmin::MODERATEUR, 'Aminata', 'Fall', 'moderation@senegalimmo.test', '775556677'],
        [RoleAdmin::FINANCE, 'Cheikh', 'Gueye', 'finance@senegalimmo.test', '776667788'],
    ];

    public function run(): void
    {
        $this->call(AdminSeeder::class);
        $admin = Administrateur::where('niveau', RoleAdmin::SUPER_ADMIN)->firstOrFail();
        $comptes = collect(self::COMPTES)->map(fn (array $c): Compte => $this->compte(...$c));
        foreach (self::ADMINISTRATEURS as [$niveau, $prenom, $nom, $email, $telephone]) {
            Administrateur::updateOrCreate(['email' => $email], [
                'prenom' => $prenom, 'nom' => $nom, 'telephone' => $telephone, 'niveau' => $niveau,
                'password' => env('DEMO_MOT_DE_PASSE', self::MOT_DE_PASSE_DEFAUT),
            ]);
        }

        foreach (require self::DOSSIER.'/annonces.php' as $donnees) {
            if (Bien::where('titre', $donnees['bien']['titre'])->exists()) {
                continue;
            }
            DB::transaction(fn () => $this->annonce($donnees, $comptes, $admin));
        }
    }

    private function compte(string $classe, string $prenom, string $nom, string $email, string $telephone): Compte
    {
        $attributs = ['prenom' => $prenom, 'nom' => $nom, 'telephone' => $telephone, 'password' => env('DEMO_MOT_DE_PASSE', self::MOT_DE_PASSE_DEFAUT)];
        if ($classe === Proprietaire::class) {
            $attributs['identite_verifiee'] = true;
        }
        if ($classe === Agent::class) {
            $attributs += ['numero_carte_professionnelle' => 'CP-DK-2024-0187', 'agence' => 'Sarr Immobilier', 'statut_validation' => StatutValidation::VALIDE, 'valide_le' => now()];
        }

        return $classe::updateOrCreate(['email' => $email], $attributs);
    }

    private function annonce(array $d, Collection $comptes, Administrateur $admin): void
    {
        $proprietaire = $comptes[$d['proprietaire']];
        $bien = new Bien($d['bien']);
        $proprietaire->enregistrerBien($bien);
        foreach ($d['photos'] as $photo) {
            $bien->ajouterMedia(Media::depuisFichier(file_get_contents(self::DOSSIER."/{$photo}.jpg"), "{$photo}.jpg", TypeMedia::PHOTO));
        }

        $annonce = $proprietaire->publierAnnonce($bien, TypeTransaction::from($d['transaction']), $d['prix'], $d['charges'], $d['caution']);
        $admin->modererAnnonce($annonce, DecisionModeration::APPROUVER);
        if ($d['badge']) {
            $admin->attribuerBadge($annonce->fresh());
        }
        if (isset($d['agent'])) {
            $this->mandater($proprietaire, $comptes[$d['agent']], $bien);
        }
    }

    private function mandater(Proprietaire $proprietaire, Agent $agent, Bien $bien): void
    {
        $mandat = $proprietaire->mandaterAgent($agent, $bien, TypeMandat::EXCLUSIF, self::TAUX_MANDAT, today(), today()->addYear());
        $signature = app(SignatureElectroniqueSimple::class);
        foreach ($mandat->signatures()->with('signataire')->get() as $s) {
            $signature->signer($s, $s->signataire, self::ADRESSE_IP);
        }
        $mandat->actualiserSignatures();
    }
}
