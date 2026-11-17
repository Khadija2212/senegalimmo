<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <title>{{ $contrat->reference }}</title>
    <style>
        body { font-family: 'DejaVu Sans', sans-serif; font-size: 10.5px; color: #14120f; line-height: 1.55; margin: 0 6px; }
        h1 { font-size: 17px; margin: 0 0 2px; letter-spacing: 0.5px; }
        .ref { color: #6b6457; margin-bottom: 18px; }
        h2 { font-size: 12px; margin: 18px 0 6px; padding-bottom: 3px; border-bottom: 1px solid #c69a4b; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 5px 4px; border-bottom: 1px solid #e7e1d6; vertical-align: top; }
        td.l { width: 36%; color: #6b6457; }
        p { text-align: justify; margin: 6px 0; }
        .sig td { border: 1px solid #d8d0c2; padding: 10px; width: 50%; height: 70px; }
        .pied { margin-top: 24px; font-size: 8.5px; color: #8f8676; text-align: center; }
    </style>
</head>
<body>
    <h1>@yield('titre')</h1>
    <div class="ref">Référence {{ $contrat->reference }}, établi le {{ $contrat->created_at->locale('fr')->translatedFormat('d F Y') }}</div>

    <h2>Le bien</h2>
    <table>
        <tr><td class="l">Désignation</td><td>{{ $bien->titre }}</td></tr>
        <tr><td class="l">Adresse</td><td>{{ $bien->adresseComplete() }}</td></tr>
        <tr><td class="l">Type et surface</td><td>{{ ucfirst(str_replace('_', ' ', $bien->type->value)) }}, {{ rtrim(rtrim(number_format($bien->surface, 2, ',', ' '), '0'), ',') }} m², {{ $bien->nombre_pieces }} pièce(s) dont {{ $bien->nombre_chambres }} chambre(s){{ $bien->meuble ? ', meublé' : '' }}</td></tr>
    </table>

    @yield('corps')

    <h2>Signatures</h2>
    <table class="sig"><tr>
        @foreach ($contrat->signataires() as $partie)
            @php($s = $signatures->firstWhere('signataire_id', $partie->id))
            <td>
                <strong>{{ $partie->nomComplet() }}</strong><br>
                @if ($s && $s->signe_le)
                    Signé électroniquement le {{ $s->signe_le->locale('fr')->translatedFormat('d F Y à H:i') }}<br>
                    Adresse IP {{ $s->adresse_ip }}, référence {{ $s->reference_service }}
                @else
                    En attente de signature
                @endif
            </td>
        @endforeach
    </tr></table>

    <div class="pied">Document établi par SénégalImmo. Signature électronique simple au sens de la loi n° 2008-08 du 25 janvier 2008 sur les transactions électroniques.</div>
</body>
</html>
