<?php

namespace App\Enums;

/** Énumération RoleAdmin du diagramme : niveau d'un administrateur. */
enum RoleAdmin: string
{
    use ValeursEnum;

    case MODERATEUR = 'moderateur';
    case FINANCE = 'finance';
    case SUPER_ADMIN = 'super_admin';
}
