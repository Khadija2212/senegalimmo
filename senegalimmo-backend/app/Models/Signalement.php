<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Signalement extends Model
{
    protected $table = 'signalements';

    protected $fillable = [
        'user_id',
        'bien_id',
        'motif',
        'description',
        'statut',
        'reponse_admin',
    ];

    public function user()
    {
        return $this->belongsTo(Client::class, 'user_id')->withoutGlobalScope('role');
    }

    public function bien()
    {
        return $this->belongsTo(Bien::class);
    }
}
