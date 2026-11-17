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
        return $this->belongsTo(Client::class, 'expediteur_id')->withoutGlobalScope('role');
    }

    public function destinataire()
    {
        return $this->belongsTo(Client::class, 'destinataire_id')->withoutGlobalScope('role');
    }
}