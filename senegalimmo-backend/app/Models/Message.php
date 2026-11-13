<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $table = 'messages';

    protected $fillable = [
        'expediteur_id',
        'destinataire_id',
        'bien_id',
        'contenu',
        'lu',
    ];

    protected $casts = [
        'lu' => 'boolean',
    ];

    public function bien()
    {
        return $this->belongsTo(Bien::class);
    }

    public function expediteur()
    {
        return $this->belongsTo(User::class, 'expediteur_id');
    }

    public function destinataire()
    {
        return $this->belongsTo(User::class, 'destinataire_id');
    }
}