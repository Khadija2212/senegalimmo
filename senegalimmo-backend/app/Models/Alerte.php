<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Alerte extends Model
{
    protected $table = 'alertes';

    protected $fillable = ['user_id', 'titre', 'message', 'lien', 'lue'];

    protected $casts = ['lue' => 'boolean'];
}