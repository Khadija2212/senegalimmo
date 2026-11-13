<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Quittance {{ $paiement->reference }}</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #19201d; line-height: 1.5; }
        h1 { text-align: center; font-size: 17px; margin: 0 0 4px; color: #184e3b; }
        .sub { text-align: center; color: #526059; margin-bottom: 18px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 6px 4px; border-bottom: 1px solid #e3e8f0; vertical-align: top; }
        td.l { width: 38%; color: #526059; }
        .total { margin-top: 16px; text-align: center; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; font-size: 15px; font-weight: bold; color: #184e3b; }
        .footer { margin-top: 22px; text-align: center; font-size: 9px; color: #888; }
    </style>
</head>
<body>

@php
    $fcfa = number_format((float) $paiement->montant, 0, ',', ' ') . ' FCFA';
    $labels = ['orange_money' => 'Orange Money', 'wave' => 'Wave', 'free_money' => 'Free Money'];
    $date = $paiement->date_paiement
        ? $paiement->date_paiement->copy()->locale('fr')->translatedFormat('d F Y à H:i')
        : ($paiement->created_at ? $paiement->created_at->format('d/m/Y à H:i') : now()->format('d/m/Y à H:i'));

    $objet = $paiement->type === 'caution'
        ? 'Dépôt de garantie (caution)'
        : ($paiement->periode
            ? 'Loyer du mois de ' . \Illuminate\Support\Carbon::createFromFormat('Y-m', $paiement->periode)->locale('fr')->translatedFormat('F Y')
            : 'Règlement de loyer');

    $bien = $paiement->contrat?->bien ?? $paiement->promesse?->bien;
    $beneficiaire = $paiement->beneficiaire;
    $payeur = $paiement->payeur;
@endphp

<h1>{{ $paiement->type === 'caution' ? 'REÇU DE CAUTION' : 'QUITTANCE DE LOYER' }}</h1>
<div class="sub">N° {{ $paiement->reference }} · {{ $date }}</div>

<table>
    <tr><td class="l">Bailleur / Propriétaire</td><td>{{ $beneficiaire ? $beneficiaire->prenom . ' ' . $beneficiaire->nom : 'N/A' }}</td></tr>
    <tr><td class="l">Locataire / Client</td><td>{{ $payeur ? $payeur->prenom . ' ' . $payeur->nom : 'N/A' }}</td></tr>
    @if ($bien)
    <tr><td class="l">Bien loué</td><td>{{ $bien->titre }}<br>{{ $bien->adresse }}, {{ $bien->quartier }}, {{ $bien->ville }}</td></tr>
    @endif
    <tr><td class="l">Objet</td><td>{{ $objet }}</td></tr>
    @if ($paiement->contrat_id)
    <tr><td class="l">Bail</td><td>BAIL-{{ str_pad($paiement->contrat_id, 4, '0', STR_PAD_LEFT) }}</td></tr>
    @endif
    <tr><td class="l">Mode de paiement</td><td>{{ $labels[$paiement->methode] ?? $paiement->methode }} (via PayTech)</td></tr>
</table>

<div class="total">Montant reçu : {{ $fcfa }}</div>

<p style="margin-top:14px; text-align:justify;">
    Le bailleur reconnaît avoir reçu du locataire la somme indiquée ci-dessus,
    au titre de l'objet mentionné, et lui en donne quittance sous réserve d'encaissement définitif.
</p>

<div class="footer">Document officiel généré par SénégalImmo · Transaction sécurisée et tracée.</div>

</body>
</html>
