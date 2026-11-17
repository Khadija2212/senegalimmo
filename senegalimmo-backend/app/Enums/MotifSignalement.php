<?php

namespace App\Enums;

/** Énumération MotifSignalement du diagramme de classes. */
enum MotifSignalement: string
{
    use ValeursEnum;

    case ANNONCE_FRAUDULEUSE = 'annonce_frauduleuse';
    case INFORMATIONS_ERRONEES = 'informations_erronees';
    case BIEN_INDISPONIBLE = 'bien_indisponible';
    case COMPORTEMENT_ABUSIF = 'comportement_abusif';
    case PROBLEME_PAIEMENT = 'probleme_paiement';
    case AUTRE = 'autre';
}
