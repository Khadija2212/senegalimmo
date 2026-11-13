<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>Bail {{ $contrat->id }}</title>
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

<h1>CONTRAT DE BAIL</h1>
<div class="sub">
    Référence BAIL-{{ str_pad($contrat->id, 4, '0', STR_PAD_LEFT) }}
    · Établi le {{ $fmt($contrat->created_at) }}
</div>

<h2>ENTRE LES SOUSSIGNÉS</h2>
<table class="info">
    <tr>
        <td class="label">Le Bailleur</td>
        <td><strong>{{ $contrat->proprietaire->prenom }} {{ $contrat->proprietaire->nom }}</strong>
            @if ($contrat->proprietaire->telephone), tél. {{ $contrat->proprietaire->telephone }}@endif
        </td>
    </tr>
    <tr>
        <td class="label">Le Preneur</td>
        <td><strong>{{ $contrat->locataire->prenom }} {{ $contrat->locataire->nom }}</strong>
            @if ($contrat->locataire->telephone), tél. {{ $contrat->locataire->telephone }}@endif
        </td>
    </tr>
</table>

<h2>ARTICLE 1 : OBJET DU BAIL</h2>
<p>Le Bailleur donne à bail au Preneur, qui l'accepte, le bien suivant :</p>
<table class="info">
    <tr><td class="label">Désignation</td><td>{{ $contrat->bien->titre }} ({{ ucfirst($contrat->bien->type) }})</td></tr>
    <tr><td class="label">Adresse</td><td>{{ $contrat->bien->adresse }}, {{ $contrat->bien->quartier }}, {{ $contrat->bien->ville }}</td></tr>
    @if ($contrat->bien->surface)
        <tr><td class="label">Surface</td><td>{{ $contrat->bien->surface }} m²</td></tr>
    @endif
    @if ($contrat->bien->chambres)
        <tr><td class="label">Chambres</td><td>{{ $contrat->bien->chambres }}</td></tr>
    @endif
</table>

<h2>ARTICLE 2 : DURÉE</h2>
<p>
    Le bail est conclu pour une durée de <strong>{{ $contrat->duree_mois }} mois</strong>,
    à compter du <strong>{{ $fmt($contrat->date_debut) }}</strong>
    jusqu'au <strong>{{ $fmt($contrat->date_fin) }}</strong>.
</p>

<h2>ARTICLE 3 : LOYER</h2>
<p>
    Le loyer mensuel est fixé à <strong>{{ $fcfa($contrat->loyer_mensuel) }}</strong>.
    Il est payable mensuellement et d'avance, par Orange Money, Wave ou Free Money
    via la plateforme SénégalImmo. Une quittance est délivrée pour chaque paiement.
</p>

<h2>ARTICLE 4 : DÉPÔT DE GARANTIE</h2>
<p>
    Le Preneur verse un dépôt de garantie de <strong>{{ $fcfa($contrat->caution) }}</strong>.
    Il est restitué en fin de bail, après l'état des lieux de sortie, déduction faite
    des sommes éventuellement dues au titre des loyers impayés ou des réparations locatives.
</p>

<h2>ARTICLE 5 : ÉTAT DES LIEUX</h2>
<p>
    Un état des lieux contradictoire est établi à l'entrée et à la sortie du Preneur.
</p>

<h2>ARTICLE 6 : OBLIGATIONS DU PRENEUR</h2>
<p>
    Le Preneur s'engage à payer le loyer aux échéances convenues, à user paisiblement
    du bien, à l'entretenir en bon père de famille et à ne pas sous-louer ni céder son
    droit au bail sans l'accord écrit du Bailleur.
</p>

<h2>ARTICLE 7 : OBLIGATIONS DU BAILLEUR</h2>
<p>
    Le Bailleur s'engage à remettre le bien en bon état d'usage et à garantir
    au Preneur la jouissance paisible du bien pendant toute la durée du bail.
</p>

<h2>ARTICLE 8 : RÉSILIATION</h2>
<p>
    Chacune des parties peut mettre fin au bail par écrit, en respectant le préavis
    prévu par la réglementation en vigueur au Sénégal.
</p>

<h2>ARTICLE 9 : DROIT APPLICABLE</h2>
<p>
    Le présent contrat est soumis au droit sénégalais. À défaut d'accord amiable,
    tout litige relève des juridictions compétentes.
</p>

<h2>SIGNATURES</h2>
<table class="sign">
    <tr>
        <td>
            <strong>Le Bailleur</strong><br>
            {{ $contrat->proprietaire->prenom }} {{ $contrat->proprietaire->nom }}
            <div class="sign-box">
                @if ($contrat->signe_proprietaire)
                    <span class="ok">✓ Signé électroniquement</span><br>
                    le {{ $contrat->signe_proprietaire_le->copy()->locale('fr')->translatedFormat('d F Y à H:i') }}
                @else
                    <span class="wait">En attente de signature</span>
                @endif
            </div>
        </td>
        <td>
            <strong>Le Preneur</strong><br>
            {{ $contrat->locataire->prenom }} {{ $contrat->locataire->nom }}
            <div class="sign-box">
                @if ($contrat->signe_locataire)
                    <span class="ok">✓ Signé électroniquement</span><br>
                    le {{ $contrat->signe_locataire_le->copy()->locale('fr')->translatedFormat('d F Y à H:i') }}
                @else
                    <span class="wait">En attente de signature</span>
                @endif
            </div>
        </td>
    </tr>
</table>

<div class="footer">
    Document généré par SénégalImmo · Les signatures électroniques sont enregistrées avec horodatage.
</div>

</body>
</html>