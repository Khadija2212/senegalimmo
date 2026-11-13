<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Categorie extends Model
{
    protected $table = 'categories';

    protected $fillable = [
        'nom',
        'slug',
        'description',
        'icone',
    ];

    public function biens()
    {
        return $this->hasMany(Bien::class);
    }
}
