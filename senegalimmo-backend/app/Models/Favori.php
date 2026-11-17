<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Favori extends Model
{
    protected $table = 'favoris';

    protected $fillable = [
        'user_id',
        'bien_id',
    ];

    public function user()
    {
        return $this->belongsTo(Client::class, 'user_id');
    }

    public function bien()
    {
        return $this->belongsTo(Bien::class);
    }
}
