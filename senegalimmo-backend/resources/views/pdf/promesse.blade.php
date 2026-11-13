<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Promesse de vente {{ $promesse->id }}</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 11px; color: #222; line-height: 1.55; }
        h1 { text-align: center; font-size: 17px; margin: 0 0 4px; color: #184e3b; }
        .sub { text-align: center; color: #526059; margin-bottom: 20px; }
        h2 { font-size: 12px; background: #f0fdf4; border-left: 3px solid #184e3b; padding: 5px 8px; margin: 16px 0 6px; color: #184e3b; }
        table.info { width: 100%; border-collapse: collapse; }
        table.info td { padding: 3px 0; vertical-align: top; }
        .label { width: 30%; color: #666; }
        p { margin: 4px 0; text-align: justify; }
        table.sign { width: 100%; margin-top: 26px; border-collapse: separate; border-spacing: 10px 0; }
        table.sign td { width: 50%; vertical-align: top; }
        .sign-box { border: 1px solid #bbb; padding: 10px; height: 70px; }
        .ok { color: #2e7d32; font-weight: bold; }
        .wait { color: #ef6c00; }
        .footer { margin-top: 24px; text-align: center; font-size: 9px; color: #888; }
    </style>
</head>
<body>

@php
    $fmt = fn ($d) => $d ? $d->copy()->locale('fr')->translatedFormat('d F Y') : '-';
    $fcfa = fn ($n) => number_format((float) $n, 0, ',', ' ') . ' FCFA';
@endphp

<h1>PROMESSE DE VENTE</h1>
<div class="sub">
    Référence PV-{{ str_pad($promesse->id, 4, '0', STR_PAD_LEFT) }}
    · Établie le {{ $fmt($promesse->created_at) }}
</div>

<h2>ENTRE LES SOUSSIGNÉS</h2>
<table class="info">
    <tr>
        <td class="label">Le Vendeur</td>
        <td><strong>{{ $promesse->vendeur->prenom }} {{ $promesse->vendeur->nom }}</strong>
            @if ($promesse->vendeur->telephone), tél. {{ $promesse->vendeur->telephone }}@endif
        </td>
    </tr>
    <tr>
        <td class="label">L'Acquéreur</td>
        <td><strong>{{ $promesse->acheteur->prenom }} {{ $promesse->acheteur->nom }}</strong>
            @if ($promesse->acheteur->telephone), tél. {{ $promesse->acheteur->telephone }}@endif
        </td>
    </tr>
</table>

<h2>ARTICLE 1 : OBJET</h2>
<p>Le Vendeur promet de vendre à l'Acquéreur, qui promet d'acquérir, le bien suivant :</p>
<table class="info">
    <tr><td class="label">Désignation</td><td>{{ $promesse->bien->titre }} ({{ ucfirst($promesse->bien->type) }})</td></tr>
    <tr><td class="label">Adresse</td><td>{{ $promesse->bien->adresse }}, {{ $promesse->bien->quartier }}, {{ $promesse->bien->ville }}</td></tr>
    @if ($promesse->bien->surface)
        <tr><td class="label">Surface</td><td>{{ $promesse->bien->surface }} m²</td></tr>
    @endif
</table>

<h2>ARTICLE 2 : PRIX</h2>
<p>
    La vente est convenue moyennant le prix de <strong>{{ $fcfa($promesse->prix_convenu) }}</strong>,
    issu de la négociation menée entre les parties sur la plateforme SénégalImmo.
</p>

<h2>ARTICLE 3 : INDEMNITÉ D'IMMOBILISATION</h2>
@if ((float) $promesse->indemnite_immobilisation > 0)
    <p>
        L'Acquéreur s'engage à verser une indemnité d'immobilisation de
        <strong>{{ $fcfa($promesse->indemnite_immobilisation) }}</strong>, qui s'imputera sur le prix
        lors de la signature de l'acte définitif.
    </p>
@else
    <p>Aucune indemnité d'immobilisation n'est prévue.</p>
@endif

<h2>ARTICLE 4 : CONDITIONS SUSPENSIVES</h2>
<p>{{ $promesse->conditions ?: 'Aucune condition suspensive particulière n\'a été convenue.' }}</p>

<h2>ARTICLE 5 : RÉITÉRATION DE LA VENTE</h2>
<p>
    Les parties s'engagent à réitérer la vente par acte authentique devant notaire
    au plus tard le <strong>{{ $fmt($promesse->date_limite) }}</strong>.
    Le transfert de propriété n'intervient qu'à la signature de cet acte.
</p>

<h2>ARTICLE 6 : DÉSISTEMENT</h2>
<p>
    Les conséquences du désistement de l'une des parties sont réglées à l'amiable entre elles ou,
    à défaut, par les juridictions compétentes.
</p>

<h2>ARTICLE 7 : DROIT APPLICABLE</h2>
<p>La présente promesse est soumise au droit sénégalais.</p>

<h2>SIGNATURES</h2>
<table class="sign">
    <tr>
        <td>
            <strong>Le Vendeur</strong><br>
            {{ $promesse->vendeur->prenom }} {{ $promesse->vendeur->nom }}
            <div class="sign-box">
                @if ($promesse->signe_vendeur)
                    <span class="ok">✓ Signé électroniquement</span><br>
                    le {{ $promesse->signe_vendeur_le->copy()->locale('fr')->translatedFormat('d F Y à H:i') }}
                @else
                    <span class="wait">En attente de signature</span>
                @endif
            </div>
        </td>
        <td>
            <strong>L'Acquéreur</strong><br>
            {{ $promesse->acheteur->prenom }} {{ $promesse->acheteur->nom }}
            <div class="sign-box">
                @if ($promesse->signe_acheteur)
                    <span class="ok">✓ Signé électroniquement</span><br>
                    le {{ $promesse->signe_acheteur_le->copy()->locale('fr')->translatedFormat('d F Y à H:i') }}
                @else
                    <span class="wait">En attente de signature</span>
                @endif
            </div>
        </td>
    </tr>
</table>

<div class="footer">
    Document généré par SénégalImmo · Modèle à valeur pédagogique, à faire valider par un notaire pour un usage réel.
</div>

</body>
</html>