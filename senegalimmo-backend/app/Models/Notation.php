<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notation extends Model
{
    protected $table = 'notations';

    protected $fillable = [
        'noteur_id',
        'note_id',
        'bien_id',
        'note',
        'commentaire',
    ];

    protected $casts = [
        'note' => 'integer',
    ];

    public function noteur()
    {
        return $this->belongsTo(User::class, 'noteur_id');
    }

    public function evalue()
    {
        return $this->belongsTo(User::class, 'note_id');
    }

    public function bien()
    {
        return $this->belongsTo(Bien::class);
    }
}