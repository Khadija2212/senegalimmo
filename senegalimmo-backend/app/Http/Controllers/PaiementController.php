<?php

namespace App\Http\Controllers;

use App\Models\Contrat;
use App\Models\Paiement;
use App\Models\PromesseVente;
use App\Models\User;
use App\Services\PayTechService;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaiementController extends Controller
{
    private const LABELS = [
        'orange_money' => 'Orange Money',
        'wave'         => 'Wave',
        'free_money'   => 'Free Money',
    ];

    public function __construct(private PayTechService $paytech)
    {
    }

    private function estPartie(Request $request, Paiement $paiement): bool
    {
        $id = $request->user()->id;

        return $paiement->payeur_id === $id || $paiement->beneficiaire_id === $id || $request->user()->role === 'administrateur';
    }

    // Liste des périodes de loyer du bail : ['2026-11', '2026-12', ...]
    private function periodes(Contrat $contrat): array
    {
        $periodes = [];
        for ($i = 0; $i < (int) $contrat->duree_mois; $i++) {
            $periodes[] = $contrat->date_debut->copy()->addMonthsNoOverflow($i)->format('Y-m');
        }

        return $periodes;
    }

    private function loyersPayes(Contrat $contrat): array
    {
        return Paiement::where('contrat_id', $contrat->id)
            ->where('type', 'loyer')
            ->where('statut', 'confirme')
            ->pluck('periode')
            ->all();
    }

    public function index(Request $request)
    {
        $id = $request->user()->id;
        $user = $request->user();

        $query = Paiement::with([
            'contrat.bien:id,titre,quartier,ville',
            'promesse.bien:id,titre,quartier,ville',
            'payeur:id,nom,prenom',
            'beneficiaire:id,nom,prenom',
        ])->latest();

        if ($user->role !== 'administrateur') {
            $query->where(fn ($q) => $q->where('payeur_id', $id)->orWhere('beneficiaire_id', $id));
        }

        return response()->json($query->get());
    }

    // Situation des paiements d'un bail (côté locataire)
    public function echeancier(Request $request, Contrat $contrat)
    {
        if ($contrat->locataire_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $payes = $this->loyersPayes($contrat);
        $prochain = collect($this->periodes($contrat))->first(fn ($p) => !in_array($p, $payes));

        return response()->json([
            'caution_montant'  => (float) $contrat->caution,
            'caution_payee'    => Paiement::where('contrat_id', $contrat->id)
                ->where('type', 'caution')->where('statut', 'confirme')->exists(),
            'loyer_montant'    => (float) $contrat->loyer_mensuel,
            'loyers_payes'     => count($payes),
            'loyers_total'     => (int) $contrat->duree_mois,
            'prochaine_periode' => $prochain,
        ]);
    }

    // Démarre un paiement : crée la ligne puis demande un lien à PayTech
    public function initier(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'contrat_id'  => 'nullable|exists:contrats,id',
            'promesse_id' => 'nullable|exists:promesses_vente,id',
            'type'        => 'required|in:caution,loyer,indemnite,tranche_vente',
            'methode'     => 'required|in:orange_money,wave,free_money',
        ]);

        if (!$this->paytech->isConfigured()) {
            return response()->json(['message' => 'PayTech n\'est pas configuré (clés absentes du fichier .env).'], 500);
        }

        // Cas 1 : Paiement par l'acheteur (Indemnité d'immobilisation de promesse de vente)
        if (in_array($data['type'], ['indemnite', 'tranche_vente'], true)) {
            if (!$request->filled('promesse_id')) {
                return response()->json(['message' => 'Le numéro de la promesse de vente est requis.'], 422);
            }

            $promesse = PromesseVente::with('bien')->findOrFail($data['promesse_id']);

            if ($promesse->acheteur_id !== $user->id) {
                return response()->json(['message' => 'Cette promesse de vente ne vous concerne pas.'], 403);
            }

            $montant = (int) round((float) $promesse->indemnite_immobilisation);

            if ($montant <= 0) {
                return response()->json(['message' => 'Aucune indemnité d\'immobilisation requise pour cette promesse.'], 422);
            }

            $dejaPaye = Paiement::where('promesse_id', $promesse->id)
                ->where('type', 'indemnite')
                ->where('statut', 'confirme')
                ->exists();

            if ($dejaPaye) {
                return response()->json(['message' => 'L\'indemnité d\'immobilisation a déjà été payée.'], 422);
            }

            $paiement = Paiement::create([
                'promesse_id'     => $promesse->id,
                'payeur_id'       => $user->id,
                'beneficiaire_id' => $promesse->vendeur_id,
                'montant'         => $montant,
                'methode'         => $data['methode'],
                'type'            => 'indemnite',
                'reference'       => 'SI-VNT' . now()->format('ymdHis') . Str::upper(Str::random(4)),
                'statut'          => 'en_attente',
            ]);

            $libelle = 'Indemnité immobilisation - ' . $promesse->bien->titre;
            $customField = json_encode(['paiement_id' => $paiement->id, 'promesse_id' => $promesse->id]);
        }
        // Cas 2 : Paiement par le locataire (Caution ou Loyer)
        else {
            if (!$request->filled('contrat_id')) {
                return response()->json(['message' => 'Le contrat de bail est requis.'], 422);
            }

            $contrat = Contrat::with('bien')->findOrFail($data['contrat_id']);

            if ($contrat->locataire_id !== $user->id) {
                return response()->json(['message' => 'Ce bail ne vous concerne pas.'], 403);
            }

            if ($contrat->statut !== 'signe') {
                return response()->json(['message' => 'Le bail doit d\'abord être signé par les deux parties.'], 422);
            }

            $periode = null;

            if ($data['type'] === 'caution') {
                $montant = (int) round((float) $contrat->caution);

                $dejaPayee = Paiement::where('contrat_id', $contrat->id)
                    ->where('type', 'caution')->where('statut', 'confirme')->exists();

                if ($dejaPayee) {
                    return response()->json(['message' => 'La caution est déjà payée.'], 422);
                }
            } else {
                $montant = (int) round((float) $contrat->loyer_mensuel);
                $payes = $this->loyersPayes($contrat);
                $periode = collect($this->periodes($contrat))->first(fn ($p) => !in_array($p, $payes));

                if (!$periode) {
                    return response()->json(['message' => 'Tous les loyers de ce bail sont payés.'], 422);
                }
            }

            if ($montant <= 0) {
                return response()->json(['message' => 'Le montant à payer est nul.'], 422);
            }

            $paiement = Paiement::create([
                'contrat_id'      => $contrat->id,
                'payeur_id'       => $user->id,
                'beneficiaire_id' => $contrat->proprietaire_id,
                'montant'         => $montant,
                'methode'         => $data['methode'],
                'type'            => $data['type'],
                'reference'       => 'SI' . now()->format('ymdHis') . Str::upper(Str::random(4)),
                'statut'          => 'en_attente',
                'periode'         => $periode,
            ]);

            $libelle = $data['type'] === 'caution'
                ? 'Caution - ' . $contrat->bien->titre
                : 'Loyer ' . $periode . ' - ' . $contrat->bien->titre;

            $customField = json_encode(['paiement_id' => $paiement->id, 'contrat_id' => $contrat->id]);
        }

        $front = rtrim((string) config('services.paytech.front_url'), '/');

        $payload = [
            'item_name'      => $libelle,
            'item_price'     => $montant,
            'currency'       => 'XOF',
            'ref_command'    => $paiement->reference,
            'command_name'   => $libelle . ' via SénégalImmo',
            'env'            => config('services.paytech.env', 'test'),
            'target_payment' => self::LABELS[$data['methode']],
            'success_url'    => $front . '/paiement/retour?ref=' . $paiement->reference,
            'cancel_url'     => $front . '/paiement/retour?annule=1&ref=' . $paiement->reference,
            'custom_field'   => $customField,
        ];

        // PayTech n'accepte que des URL de notification en HTTPS
        $ipn = (string) config('services.paytech.ipn_url');
        if (str_starts_with($ipn, 'https://')) {
            $payload['ipn_url'] = $ipn;
        }

        $reponse = $this->paytech->requestPayment($payload);

        if (!$reponse['success']) {
            $paiement->update(['statut' => 'echoue']);

            Log::warning('Échec demande PayTech', ['reponse' => $reponse, 'paiement_id' => $paiement->id]);

            return response()->json([
                'message' => $reponse['error'] ?? 'Impossible d\'initialiser le paiement.',
            ], 502);
        }

        $paiement->update(['token_paytech' => $reponse['token']]);

        return response()->json([
            'redirect_url' => $reponse['redirect_url'],
            'reference'    => $paiement->reference,
            'token'        => $reponse['token'],
        ]);
    }

    // Notification de PayTech (IPN) : route publique, authentifiée par signature
    public function ipn(Request $request)
    {
        if (!$this->paytech->verifyIpn($request)) {
            Log::warning('IPN PayTech rejeté (signature invalide)');

            return response('IPN KO', 403);
        }

        $paiement = Paiement::where('reference', $request->input('ref_command'))->first();

        if (!$paiement) {
            return response('Référence inconnue', 404);
        }

        $event = $request->input('type_event');

        if ($event === 'sale_complete') {
            $prix = $request->input('final_item_price') ?: $request->input('item_price');

            if ((int) round((float) $prix) !== (int) round((float) $paiement->montant)) {
                Log::warning('IPN PayTech : montant différent', [
                    'attendu' => $paiement->montant,
                    'recu'    => $prix,
                ]);

                return response('Montant incohérent', 422);
            }

            $this->confirmer($paiement);
        } elseif ($event === 'sale_canceled' && $paiement->statut === 'en_attente') {
            $paiement->update(['statut' => 'echoue']);
        }

        return response('IPN OK', 200);
    }

    // Confirme un paiement une seule fois et crédite le portefeuille du bénéficiaire
    private function confirmer(Paiement $paiement): void
    {
        DB::transaction(function () use ($paiement) {
            $p = Paiement::lockForUpdate()->find($paiement->id);

            if (!$p || $p->statut === 'confirme') {
                return;
            }

            $p->update(['statut' => 'confirme', 'date_paiement' => now()]);

            User::whereKey($p->beneficiaire_id)->increment('solde_portefeuille', $p->montant);
        });
    }

    // Suivi depuis la page de retour
    public function showByReference(Request $request, string $reference)
    {
        $paiement = Paiement::with(['contrat.bien:id,titre', 'promesse.bien:id,titre'])
            ->where('reference', $reference)
            ->where('payeur_id', $request->user()->id)
            ->first();

        if (!$paiement) {
            return response()->json(['message' => 'Paiement introuvable.'], 404);
        }

        return response()->json($paiement);
    }

    // Secours : interroge PayTech si l'IPN n'est pas arrivé
    public function verifier(Request $request, Paiement $paiement)
    {
        if ($paiement->payeur_id !== $request->user()->id && $request->user()->role !== 'administrateur') {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if ($paiement->statut === 'en_attente') {
            $confirme = false;

            if ($paiement->token_paytech) {
                $reponse = $this->paytech->getStatus($paiement->token_paytech);
                Log::info('PayTech get-status', ['reference' => $paiement->reference, 'reponse' => $reponse]);

                $valeurs = collect(['status', 'state', 'payment_status', 'type_event'])
                    ->map(fn ($k) => strtolower((string) ($reponse[$k] ?? '')))
                    ->filter()
                    ->all();

                $succes = ['completed', 'complete', 'success', 'successful', 'paid', 'sale_complete'];

                if (array_intersect($valeurs, $succes)) {
                    $confirme = true;
                }
            }

            // En environnement de test / local : validation automatique pour générer la quittance
            if (!$confirme && (app()->environment('local') || config('app.debug'))) {
                $confirme = true;
            }

            if ($confirme) {
                $this->confirmer($paiement);
            }
        }

        return response()->json($paiement->fresh());
    }

    // Quittance / reçu en PDF
    public function quittance(Request $request, Paiement $paiement)
    {
        if (!$this->estPartie($request, $paiement)) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        if ($paiement->statut !== 'confirme') {
            if (app()->environment('local') || config('app.debug')) {
                $this->confirmer($paiement);
            } else {
                return response()->json(['message' => 'Aucune quittance : le paiement n\'est pas confirmé.'], 422);
            }
        }

        $paiement->load(['contrat.bien', 'promesse.bien', 'payeur', 'beneficiaire']);

        $options = new Options();
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', false);

        $dompdf = new Dompdf($options);

        $viewName = $paiement->promesse_id ? 'pdf.recu_vente' : 'pdf.quittance';
        $dompdf->loadHtml(view($viewName, ['paiement' => $paiement])->render());
        $dompdf->setPaper('A5', 'portrait');
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="recu-' . $paiement->reference . '.pdf"',
        ]);
    }
}
