# Documentation du projet SénégalImmo

Modélisation UML de la plateforme. Le backend Laravel suit exactement le diagramme de classes : 38 classes et 25 énumérations.

## Contenu

| Dossier | Fichier | Rôle |
|---|---|---|
| `pdf/` | `diagrammes-cas-utilisation.pdf` | Les 5 diagrammes de cas d'utilisation, une page par diagramme |
| `pdf/` | `presentation-cas-utilisation.pdf` | Guide pour présenter les cas d'utilisation : acteurs, découpage, «include» et «extend», questions du jury |
| `pdf/` | `diagramme-de-classes.pdf` | Le diagramme de classes et les énumérations, au format A2 |
| `pdf/` | `presentation-diagramme-de-classes.pdf` | Guide pour présenter le diagramme de classes : héritage, compositions, interfaces, questions du jury |
| `diagrammes/` | `senegalimmo-cas-utilisation.drawio` | Source modifiable des cas d'utilisation, une page par diagramme |
| `diagrammes/` | `senegalimmo-classes.drawio` | Source modifiable du diagramme de classes et des énumérations |
| `diagrammes/svg/` | `01` à `07` | Export image de chaque diagramme |

## Diagrammes de cas d'utilisation

1. Cas communs : Visiteur et Utilisateur
2. Propriétaire
3. Client
4. Agent immobilier
5. Administrateur

## Diagramme de classes

- **Comptes** : `Compte` et `Utilisateur` sont abstraites. `Client`, `Proprietaire`, `Agent` et `Administrateur` en héritent.
- **Biens et annonces** : `Bien`, `Media`, `Annonce` et `OptionPremium`, ainsi que les démarches (demandes de location, offres d'achat, visites, signalements).
- **Contrats** : `Contrat` est abstraite. `Bail`, `PromesseVente` et `Mandat` en héritent. S'y rattachent les signatures et les états des lieux.
- **Paiements** : `Paiement` est abstraite. `PaiementLoyer`, `PaiementCaution` et `PaiementIndemnite` en héritent. S'y rattachent les reçus, les portefeuilles, les retraits et les règles de commission.
- **Services externes** : cinq interfaces, `PasserellePaiement` (PayTech), `ServiceCartographie` (Mapbox), `ServiceStockage`, `ServiceSignature` et `ServiceNotification`.

Les fichiers `.drawio` s'ouvrent avec [draw.io](https://app.diagrams.net).
