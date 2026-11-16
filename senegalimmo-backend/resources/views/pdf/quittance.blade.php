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
    $fcfa = number_format($paiement->montant, 0, ',', ' ') . ' FCFA';
    $date = ($paiement->confirme_le ?? $paiement->created_at)->copy()->locale('fr')->translatedFormat('d F Y à H:i');
    $estCaution = $paiement instanceof \App\Models\PaiementCaution;
    $objet = $estCaution ? 'Dépôt de garantie (caution)' : $paiement->libelle();
    $bien = $paiement->bien();
    $beneficiaire = $paiement->beneficiaire();
    $payeur = $paiement->payeur();
@endphp

<h1>{{ $estCaution ? 'Reçu de caution' : 'Quittance de loyer' }}</h1>
<div class="sub">Reçu {{ $recu->numero }}, le {{ $date }}</div>

<table>
    <tr><td class="l">Bailleur / Propriétaire</td><td>{{ $beneficiaire ? $beneficiaire->prenom . ' ' . $beneficiaire->nom : 'N/A' }}</td></tr>
    <tr><td class="l">Locataire / Client</td><td>{{ $payeur ? $payeur->prenom . ' ' . $payeur->nom : 'N/A' }}</td></tr>
    @if ($bien)
    <tr><td class="l">Bien loué</td><td>{{ $bien->titre }}<br>{{ $bien->adresse }}, {{ $bien->quartier }}, {{ $bien->ville }}</td></tr>
    @endif
    <tr><td class="l">Objet</td><td>{{ $objet }}</td></tr>
    @if ($paiement->bail_id)
    <tr><td class="l">Bail</td><td>BAIL-{{ str_pad($paiement->bail_id, 4, '0', STR_PAD_LEFT) }}</td></tr>
    @endif
    <tr><td class="l">Mode de paiement</td><td>{{ $paiement->methode->libelle() }} (via PayTech)</td></tr>
</table>

<div class="total">Montant reçu : {{ $fcfa }}</div>

<p style="margin-top:14px; text-align:justify;">
    Le bailleur reconnaît avoir reçu du locataire la somme indiquée ci-dessus,
    au titre de l'objet mentionné, et lui en donne quittance sous réserve d'encaissement définitif.
</p>

<div class="footer">Document généré par SénégalImmo. Référence du paiement : {{ $paiement->reference }}.</div>

</body>
</html>
