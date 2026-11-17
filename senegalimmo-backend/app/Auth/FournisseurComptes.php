<?php

namespace App\Auth;

use App\Models\Client;
use App\Models\Compte;
use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Fournisseur d'authentification pour la classe abstraite Compte :
 * les recherches passent par Compte::tous(), qui charge la bonne classe concrète.
 */
class FournisseurComptes extends EloquentUserProvider
{
    public function createModel(): Model&Authenticatable
    {
        return new Client();
    }

    /** @param Model|null $model */
    protected function newModelQuery($model = null): Builder
    {
        return Compte::tous();
    }
}
