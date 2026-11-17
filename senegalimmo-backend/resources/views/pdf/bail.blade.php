@extends('pdf.contrat')
@php($fcfa = fn (int $m) => number_format($m, 0, ',', ' ') . ' FCFA')

@section('titre', "Contrat de bail d'habitation")

@section('corps')
    <h2>Les parties</h2>
    <table>
        <tr><td class="l">Bailleur</td><td>{{ $contrat->proprietaire()->nomComplet() }}, {{ $contrat->proprietaire()->telephone }}</td></tr>
        <tr><td class="l">Locataire</td><td>{{ $contrat->locataire()->nomComplet() }}, {{ $contrat->locataire()->telephone }}</td></tr>
    </table>

    <h2>Conditions</h2>
    <table>
        <tr><td class="l">Prise d'effet</td><td>{{ $contrat->date_debut->locale('fr')->translatedFormat('d F Y') }}</td></tr>
        <tr><td class="l">Durée</td><td>{{ $contrat->duree_mois }} mois, jusqu'au {{ $contrat->dateFin()->locale('fr')->translatedFormat('d F Y') }}</td></tr>
        <tr><td class="l">Loyer mensuel</td><td>{{ $fcfa($contrat->loyer_mensuel) }}</td></tr>
        <tr><td class="l">Charges mensuelles</td><td>{{ $fcfa($contrat->charges) }}</td></tr>
        <tr><td class="l">Dépôt de garantie</td><td>{{ $fcfa($contrat->caution) }}</td></tr>
        <tr><td class="l">Échéance</td><td>le {{ $contrat->jour_echeance }} de chaque mois</td></tr>
    </table>

    <h2>Engagements</h2>
    <p>Le locataire paie le loyer et les charges à chaque échéance par la plateforme, qui lui délivre une quittance. Il use paisiblement des lieux et les rend dans l'état constaté à l'entrée, sauf usure normale.</p>
    <p>Le bailleur délivre un logement décent et en assure la jouissance paisible. Le dépôt de garantie est restitué en fin de bail, déduction faite des sommes dues, après l'état des lieux de sortie.</p>
@endsection
