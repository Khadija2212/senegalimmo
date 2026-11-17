<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Réserve une route à certaines classes concrètes de Compte, désignées par leur rôle. */
class ExigeRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        abort_unless(in_array($request->user()?->role, $roles, true), Response::HTTP_FORBIDDEN, "Cette action n'est pas permise à votre profil.");

        return $next($request);
    }
}
