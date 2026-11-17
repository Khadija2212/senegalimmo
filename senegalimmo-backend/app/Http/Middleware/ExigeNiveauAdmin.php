<?php

namespace App\Http\Middleware;

use App\Enums\RoleAdmin;
use App\Models\Administrateur;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Réserve une route aux administrateurs dont le niveau (RoleAdmin) couvre le domaine. */
class ExigeNiveauAdmin
{
    public function handle(Request $request, Closure $next, string $domaine): Response
    {
        $compte = $request->user();
        abort_unless($compte instanceof Administrateur && $compte->peut(RoleAdmin::from($domaine)), Response::HTTP_FORBIDDEN, "Votre niveau d'administration ne couvre pas cette action.");

        return $next($request);
    }
}
