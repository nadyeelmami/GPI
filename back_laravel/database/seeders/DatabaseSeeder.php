<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // Supprimer les anciens utilisateurs pour repartir à zéro
        User::truncate();

        // Admin
        User::create([
            'name' => 'Administrateur ISCAE',
            'email' => 'admin@iscae.mr',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);

        // Enseignant
        User::create([
            'name' => 'Professeur Dupont',
            'email' => 'dupont@iscae.mr',
            'password' => Hash::make('teacher123'),
            'role' => 'enseignant',
        ]);

        // Étudiant
        User::create([
            'name' => 'Étudiant Test',
            'email' => 'I12345@etu.iscae.mr',
            'matricule' => 'I12345',
            'password' => Hash::make('I12345iscae'),
            'role' => 'etudiant',
        ]);
    }
}
