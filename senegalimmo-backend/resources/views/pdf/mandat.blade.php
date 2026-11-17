@extends('pdf.contrat')

@section('titre', 'Mandat ' . ($contrat->type->value === 'exclusif' ? 'exclusif' : 'simple') . ' de gestion')

@section('corps')
    <h2>Les parties</h2>
    <table>
        <tr><td class="l">Mandant (propriétaire)</td><td>{{ $contrat->bien->proprietaire->nomComplet() }}, {{ $contrat->bien->proprietaire->telephone }}</td></tr>
        <tr><td class="l">Mandataire (agent)</td><td>{{ $contrat->agent->nomComplet() }}{{ $contrat->agent->agence ? ', ' . $contrat->agent->agence : '' }}, carte n° {{ $contrat->agent->numero_carte_professionnelle ?: 'non renseignée' }}</td></tr>
    </table>

    <h2>Conditions</h2>
    <table>
        <tr><td class="l">Période</td><td>du {{ $contrat->date_debut->locale('fr')->translatedFormat('d F Y') }} au {{ $contrat->date_fin->locale('fr')->translatedFormat('d F Y') }}</td></tr>
        <tr><td class="l">Commission</td><td>{{ rtrim(rtrim(number_format($contrat->taux_commission, 2, ',', ' '), '0'), ',') }} % des sommes encaissées par le mandant</td></tr>
    </table>

    <h2>Engagements</h2>
    <p>Le mandant confie au mandataire la présentation du bien, l'organisation des visites et le traitement des demandes des clients. {{ $contrat->type->value === 'exclusif' ? "Pendant la durée du mandat, il ne confie le bien à aucun autre agent." : "Il reste libre de confier le bien à d'autres intermédiaires." }}</p>
    <p>La commission est prélevée automatiquement sur le portefeuille du mandant à chaque loyer ou indemnité encaissé pendant la durée du mandat, et créditée au portefeuille du mandataire.</p>
@endsection
