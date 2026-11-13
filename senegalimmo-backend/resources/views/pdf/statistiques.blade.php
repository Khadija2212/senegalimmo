<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport Statistique - SénégalImmo</title>
  <style>
    @page {
      margin: 24px 28px;
    }
    body {
      font-family: 'DejaVu Sans', sans-serif;
      color: #19201d;
      font-size: 11px;
      line-height: 1.45;
      margin: 0;
      padding: 0;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #184e3b;
      padding-bottom: 12px;
      margin-bottom: 18px;
      border-collapse: collapse;
    }
    .brand {
      font-size: 20px;
      font-weight: bold;
      color: #184e3b;
      letter-spacing: 0.3px;
    }
    .subtitle {
      font-size: 11px;
      color: #5b6963;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
      font-size: 10px;
      color: #5b6963;
    }
    .meta-box strong {
      color: #19201d;
    }
    .kpi-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 8px 0;
      margin: 0 -8px 18px -8px;
    }
    .kpi-card {
      width: 25%;
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 10px 10px;
      vertical-align: top;
    }
    .kpi-label {
      font-size: 9px;
      text-transform: uppercase;
      color: #184e3b;
      font-weight: bold;
      letter-spacing: 0.4px;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 16px;
      font-weight: bold;
      color: #19201d;
    }
    .kpi-sub {
      font-size: 9px;
      color: #5b6963;
      margin-top: 2px;
    }
    .section-title {
      font-size: 12px;
      font-weight: bold;
      color: #184e3b;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      border-left: 3px solid #184e3b;
      padding-left: 8px;
      margin: 16px 0 8px 0;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    .data-table th {
      background-color: #184e3b;
      color: #ffffff;
      text-align: left;
      padding: 7px 10px;
      font-size: 10px;
      font-weight: bold;
    }
    .data-table th.num,
    .data-table td.num {
      text-align: right;
    }
    .data-table td {
      padding: 7px 10px;
      border-bottom: 1px solid #e5ece8;
      font-size: 10.5px;
    }
    .data-table tr:nth-child(even) td {
      background-color: #f9fbfa;
    }
    .data-table tr.total-row td {
      background-color: #f0fdf4;
      font-weight: bold;
      border-top: 1.5px solid #184e3b;
      border-bottom: 1.5px solid #184e3b;
      color: #184e3b;
    }
    .two-col-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 12px 0;
      margin: 0 -12px 6px -12px;
    }
    .two-col-cell {
      width: 50%;
      vertical-align: top;
    }
    .highlight-box {
      background-color: #f9fbfa;
      border: 1px solid #dce5e0;
      border-radius: 6px;
      padding: 10px 12px;
      margin-top: 6px;
    }
    .footer {
      margin-top: 22px;
      padding-top: 10px;
      border-top: 1px solid #dce5e0;
      font-size: 9px;
      color: #6b7872;
      text-align: center;
    }
  </style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td>
        <div class="brand">SénégalImmo</div>
        <div class="subtitle">Rapport statistique global de la plateforme immobilière</div>
      </td>
      <td class="meta-box">
        <div><strong>Date de génération :</strong> {{ $stats['date_generation'] }}</div>
        <div><strong>Administrateur :</strong> {{ $adminNom }}</div>
        <div><strong>Devise de référence :</strong> Franc CFA (FCFA)</div>
      </td>
    </tr>
  </table>

  <table class="kpi-table">
    <tr>
      <td class="kpi-card">
        <div class="kpi-label">Utilisateurs</div>
        <div class="kpi-value">{{ number_format($stats['total_utilisateurs'], 0, ',', ' ') }}</div>
        <div class="kpi-sub">{{ $stats['utilisateurs_verifies'] }} compte(s) vérifié(s)</div>
      </td>
      <td class="kpi-card">
        <div class="kpi-label">Biens enregistrés</div>
        <div class="kpi-value">{{ number_format($stats['total_biens'], 0, ',', ' ') }}</div>
        <div class="kpi-sub">{{ $stats['biens_disponibles'] }} disponible(s)</div>
      </td>
      <td class="kpi-card">
        <div class="kpi-label">Annonces</div>
        <div class="kpi-value">{{ number_format($stats['total_annonces'], 0, ',', ' ') }}</div>
        <div class="kpi-sub">{{ $stats['annonces_publiees'] }} publiée(s)</div>
      </td>
      <td class="kpi-card">
        <div class="kpi-label">Volume confirmé</div>
        <div class="kpi-value">{{ number_format($stats['volume_transactions_fcfa'], 0, ',', ' ') }} F</div>
        <div class="kpi-sub">{{ $stats['nb_paiements_confirmes'] }} paiement(s)</div>
      </td>
    </tr>
  </table>

  <div class="section-title">1. Répartition des acteurs de la plateforme</div>
  @php
    $totalUsers = max(1, (int) $stats['total_utilisateurs']);
    $roles = $stats['utilisateurs_par_role'];
    $pct = function ($count) use ($stats, $totalUsers) {
      if ((int) $stats['total_utilisateurs'] === 0) return '0,0 %';
      return number_format(($count / $totalUsers) * 100, 1, ',', ' ') . ' %';
    };
  @endphp
  <table class="data-table">
    <thead>
      <tr>
        <th>Profil / Acteur</th>
        <th class="num">Effectif</th>
        <th class="num">Part du total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Clients (locataires et acquéreurs)</td>
        <td class="num">{{ number_format($roles['clients'], 0, ',', ' ') }}</td>
        <td class="num">{{ $pct($roles['clients']) }}</td>
      </tr>
      <tr>
        <td>Propriétaires</td>
        <td class="num">{{ number_format($roles['proprietaires'], 0, ',', ' ') }}</td>
        <td class="num">{{ $pct($roles['proprietaires']) }}</td>
      </tr>
      <tr>
        <td>Agents immobiliers</td>
        <td class="num">{{ number_format($roles['agents'], 0, ',', ' ') }}</td>
        <td class="num">{{ $pct($roles['agents']) }}</td>
      </tr>
      <tr>
        <td>Administrateurs</td>
        <td class="num">{{ number_format($roles['administrateurs'], 0, ',', ' ') }}</td>
        <td class="num">{{ $pct($roles['administrateurs']) }}</td>
      </tr>
      <tr class="total-row">
        <td>Total des comptes utilisateurs</td>
        <td class="num">{{ number_format($stats['total_utilisateurs'], 0, ',', ' ') }}</td>
        <td class="num">{{ $stats['total_utilisateurs'] > 0 ? '100,0 %' : '0,0 %' }}</td>
      </tr>
    </tbody>
  </table>

  <div class="highlight-box">
    <strong>Vérification d'identité (KYC) :</strong>
    {{ $stats['utilisateurs_verifies'] }} compte(s) vérifié(s) &bull;
    {{ $stats['verifications_en_attente'] }} demande(s) en attente de validation par l'administrateur.
  </div>

  <table class="two-col-table">
    <tr>
      <td class="two-col-cell">
        <div class="section-title">2. État du parc immobilier</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Statut du bien</th>
              <th class="num">Nombre</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Disponibles</td>
              <td class="num">{{ number_format($stats['biens_disponibles'], 0, ',', ' ') }}</td>
            </tr>
            <tr>
              <td>Loués</td>
              <td class="num">{{ number_format($stats['biens_loues'], 0, ',', ' ') }}</td>
            </tr>
            <tr>
              <td>Vendus</td>
              <td class="num">{{ number_format($stats['biens_vendus'], 0, ',', ' ') }}</td>
            </tr>
            <tr class="total-row">
              <td>Total des biens</td>
              <td class="num">{{ number_format($stats['total_biens'], 0, ',', ' ') }}</td>
            </tr>
          </tbody>
        </table>
      </td>
      <td class="two-col-cell">
        <div class="section-title">3. Modération des annonces</div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Statut de l'annonce</th>
              <th class="num">Nombre</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Publiées et visibles</td>
              <td class="num">{{ number_format($stats['annonces_publiees'], 0, ',', ' ') }}</td>
            </tr>
            <tr>
              <td>En attente de validation</td>
              <td class="num">{{ number_format($stats['annonces_en_attente'], 0, ',', ' ') }}</td>
            </tr>
            <tr>
              <td>Autres statuts (rejetées / expirées)</td>
              <td class="num">{{ number_format(max(0, $stats['total_annonces'] - $stats['annonces_publiees'] - $stats['annonces_en_attente']), 0, ',', ' ') }}</td>
            </tr>
            <tr class="total-row">
              <td>Total des annonces</td>
              <td class="num">{{ number_format($stats['total_annonces'], 0, ',', ' ') }}</td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </table>

  <div class="section-title">4. Activité financière et demandes de retrait</div>
  <table class="data-table">
    <thead>
      <tr>
        <th>Indicateur financier</th>
        <th class="num">Valeur</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Nombre total de paiements confirmés</td>
        <td class="num">{{ number_format($stats['nb_paiements_confirmes'], 0, ',', ' ') }}</td>
      </tr>
      <tr>
        <td>Volume cumulé des transactions confirmées</td>
        <td class="num">{{ number_format($stats['volume_transactions_fcfa'], 0, ',', ' ') }} FCFA</td>
      </tr>
      <tr>
        <td>Demandes de retrait en attente de traitement</td>
        <td class="num">{{ number_format($stats['retraits_en_attente'], 0, ',', ' ') }}</td>
      </tr>
      <tr>
        <td>Demandes de retrait validées</td>
        <td class="num">{{ number_format($stats['retraits_valides'], 0, ',', ' ') }}</td>
      </tr>
      <tr class="total-row">
        <td>Montant total des retraits validés</td>
        <td class="num">{{ number_format($stats['montant_retraits_valides_fcfa'], 0, ',', ' ') }} FCFA</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    Document officiel généré depuis le tableau de bord administrateur SénégalImmo le {{ $stats['date_generation'] }}.
    Tous les montants sont exprimés en Francs CFA (FCFA).
  </div>
</body>
</html>
