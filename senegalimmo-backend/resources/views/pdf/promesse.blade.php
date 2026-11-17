@extends('pdf.contrat')
@php($fcfa = fn (int $m) => number_format($m, 0, ',', ' ') . ' FCFA')

@section('titre', 'Promesse de vente')

@section('corps')
    <h2>Les parties</h2>
    <table>
        <tr><td class="l">Promettant (vendeur)</td><td>{{ $contrat->vendeur()->nomComplet() }}, {{ $contrat->vendeur()->telephone }}</td></tr>
        <tr><td class="l">Bénéficiaire (acheteur)</td><td>{{ $contrat->acheteur()->nomComplet() }}, {{ $contrat->acheteur()->telephone }}</td></tr>
    </table>

    <h2>Conditions</h2>
    <table>
        <tr><td class="l">Prix de vente</td><td>{{ $fcfa($contrat->prix_vente) }}</td></tr>
        <tr><td class="l">Indemnité d'immobilisation</td><td>{{ $fcfa($contrat->indemnite_immobilisation) }}</td></tr>
        <tr><td class="l">Date limite de l'acte</td><td>{{ $contrat->date_limite_acte->locale('fr')->translatedFormat('d F Y') }}</td></tr>
        <tr><td class="l">Conditions suspensives</td><td>{{ $contrat->conditions_suspensives ?: 'Aucune' }}</td></tr>
    </table>

    <h2>Engagements</h2>
    <p>Le vendeur s'engage à vendre le bien au bénéficiaire au prix convenu jusqu'à la date limite de l'acte. En contrepartie, le bénéficiaire verse l'indemnité d'immobilisation par la plateforme.</p>
    <p>L'indemnité s'impute sur le prix si la vente est conclue. Elle est restituée au bénéficiaire si une condition suspensive n'est pas réalisée ; elle reste acquise au vendeur si le bénéficiaire renonce sans motif.</p>
@endsection
