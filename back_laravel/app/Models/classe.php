<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classe extends Model
{
    use HasFactory;

    protected $table = 'classes';

    // Autoriser le remplissage de ces colonnes
    protected $fillable = [
        'nom_classe',
        'niveau',
        'annee_scolaire'
    ];
}