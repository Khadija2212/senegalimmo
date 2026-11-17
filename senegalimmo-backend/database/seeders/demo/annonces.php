<?php

/*
 * Annonces de démonstration, reprises des maquettes validées.
 * Les photos sont dans ce dossier ; le propriétaire et l'agent sont des clés de DemoSeeder::COMPTES.
 */

return [
    [
        'proprietaire' => 'awa', 'agent' => 'moussa', 'photos' => ['sacre-coeur-facade', 'sacre-coeur-sejour', 'sacre-coeur-chambre'],
        'transaction' => 'location', 'prix' => 330000, 'charges' => 20000, 'caution' => 660000, 'badge' => true,
        'bien' => [
            'titre' => 'Appartement de 3 pièces au 2e étage, Sacré-Cœur 3', 'type' => 'appartement',
            'description' => "Au deuxième étage d'un petit immeuble de quatre logements, un séjour traversant ouvre sur un balcon côté rue. Les deux chambres donnent sur la cour, au calme. Cuisine fermée avec arrivée de gaz.\n\nCompteurs Senelec et SEN'EAU individuels. Les charges couvrent le gardiennage, l'entretien des parties communes et le ramassage des ordures.",
            'surface' => 85, 'nombre_pieces' => 3, 'nombre_chambres' => 2, 'meuble' => false,
            'adresse' => 'Villa 9214, rue SC-71', 'quartier' => 'Sacré-Cœur 3', 'ville' => 'Dakar', 'latitude' => 14.7186, 'longitude' => -17.4652,
        ],
    ],
    [
        'proprietaire' => 'awa', 'photos' => ['mermoz-facade'],
        'transaction' => 'location', 'prix' => 450000, 'charges' => 30000, 'caution' => 900000, 'badge' => true,
        'bien' => [
            'titre' => 'Appartement de 4 pièces avec terrasse, Mermoz', 'type' => 'appartement',
            'description' => "Grand appartement au quatrième étage d'une résidence récente, avec une terrasse de 20 m² plantée. Trois chambres, deux salles de bain, cuisine équipée, place de parking en sous-sol.",
            'surface' => 120, 'nombre_pieces' => 4, 'nombre_chambres' => 3, 'meuble' => false,
            'adresse' => 'Résidence Les Filaos, Mermoz Pyrotechnie', 'quartier' => 'Mermoz', 'ville' => 'Dakar', 'latitude' => 14.7083, 'longitude' => -17.4747,
        ],
    ],
    [
        'proprietaire' => 'ibrahima', 'photos' => ['point-e-facade'],
        'transaction' => 'location', 'prix' => 180000, 'charges' => 0, 'caution' => 360000, 'badge' => false,
        'bien' => [
            'titre' => 'Studio meublé avec entrée indépendante, Point E', 'type' => 'studio',
            'description' => "Studio à l'étage d'une maison familiale, avec son propre escalier extérieur. Coin cuisine, salle d'eau, lit double, climatisation. Idéal pour une personne seule.",
            'surface' => 32, 'nombre_pieces' => 1, 'nombre_chambres' => 1, 'meuble' => true,
            'adresse' => 'Rue 6, Point E', 'quartier' => 'Point E', 'ville' => 'Dakar', 'latitude' => 14.6960, 'longitude' => -17.4625,
        ],
    ],
    [
        'proprietaire' => 'ibrahima', 'photos' => ['liberte6-facade', 'liberte6-sejour', 'liberte6-chambre'],
        'transaction' => 'vente', 'prix' => 95000000, 'charges' => 0, 'caution' => 0, 'badge' => true,
        'bien' => [
            'titre' => 'Villa de plain-pied avec cour et garage, Liberté 6', 'type' => 'villa',
            'description' => "Villa construite en 2019 sur un terrain de 300 m² avec titre foncier. Grand séjour, trois chambres dont une suite, cuisine équipée, cour arborée et garage fermé pour deux véhicules.\n\nQuartier résidentiel à deux minutes de la VDN, écoles et marché de Liberté 6 à pied.",
            'surface' => 210, 'nombre_pieces' => 5, 'nombre_chambres' => 3, 'meuble' => false,
            'adresse' => 'Villa 6127, Liberté 6 extension', 'quartier' => 'Liberté 6', 'ville' => 'Dakar', 'latitude' => 14.7290, 'longitude' => -17.4592,
        ],
    ],
    [
        'proprietaire' => 'awa', 'photos' => ['ouakam-facade'],
        'transaction' => 'location', 'prix' => 400000, 'charges' => 25000, 'caution' => 800000, 'badge' => true,
        'bien' => [
            'titre' => 'Appartement de 3 pièces avec vue sur mer, Ouakam', 'type' => 'appartement',
            'description' => 'Au dernier étage, un séjour lumineux ouvre sur la mer. Deux chambres climatisées, cuisine américaine, buanderie. Immeuble calme sur une petite hauteur.',
            'surface' => 95, 'nombre_pieces' => 3, 'nombre_chambres' => 2, 'meuble' => false,
            'adresse' => 'Cité Avion, Ouakam', 'quartier' => 'Ouakam', 'ville' => 'Dakar', 'latitude' => 14.7215, 'longitude' => -17.4920,
        ],
    ],
];
