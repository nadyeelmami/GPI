<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Classe;
use App\Models\Matiere;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // Désactiver les contraintes de clés étrangères pour truncate
        Schema::disableForeignKeyConstraints();

        // Supprimer les anciennes données
        User::truncate();
        Classe::truncate();
        Matiere::truncate();

        // Réactiver les contraintes
        Schema::enableForeignKeyConstraints();

        // Admin
        User::create([
            'name' => 'Administrateur ISCAE',
            'email' => 'admin@iscae.mr',
            'password' => Hash::make('adminiscae'),
            'role' => 'admin',
        ]);

        // Enseignant
        User::create([
            'name' => 'Professeur Med',
            'email' => 'med@prof.iscae.mr',
            'password' => Hash::make('mediscae'),
            'role' => 'enseignant',
        ]);

        // Étudiant
        User::create([
            'name' => 'Esma Dah',
            'email' => 'I12345@etu.iscae.mr',
            'matricule' => 'I12345',
            'password' => Hash::make('student123'),
            'role' => 'etudiant',
        ]);

        // Classes pour chaque filière : niveau 1/2/3 pour FC, GRH, BA, DI, RT, et M1/M2 pour IG
        $filiereLevels = [
            'FC' => ['L1', 'L2', 'L3'],
            'GRH' => ['L1', 'L2', 'L3'],
            'BA' => ['L1', 'L2', 'L3'],
            'DI' => ['L1', 'L2', 'L3'],
            'RT' => ['L1', 'L2', 'L3'],
            'IG' => ['M1', 'M2'],
        ];

        foreach ($filiereLevels as $filiere => $levels) {
            foreach ($levels as $level) {
                Classe::create([
                    'nom_classe' => $filiere,
                    'niveau' => $level,
                    'annee_scolaire' => '2025-2026'
                ]);
            }
        }

        // Matières par filière
        $matieres = [
            // IG (Informatique de Gestion)
            ['nom_matiere' => 'Algorithmique & Structures de Données', 'coefficient' => 3, 'filiere' => 'IG', 'niveau' => 'L1'],
            ['nom_matiere' => 'Bases de Données Relationnelles', 'coefficient' => 3, 'filiere' => 'IG', 'niveau' => 'L2'],
            ['nom_matiere' => 'Architecture des Ordinateurs', 'coefficient' => 2, 'filiere' => 'IG', 'niveau' => 'L1'],
            ['nom_matiere' => 'Systèmes d\'Information & UML', 'coefficient' => 3, 'filiere' => 'IG', 'niveau' => 'L2'],
            ['nom_matiere' => 'Comptabilité Générale', 'coefficient' => 2, 'filiere' => 'IG', 'niveau' => 'L1'],
            
            // DI (Développement Informatique)
            ['nom_matiere' => 'Programmation Web (HTML/CSS/JS)', 'coefficient' => 3, 'filiere' => 'DI', 'niveau' => 'L1'],
            ['nom_matiere' => 'Programmation Orientée Objet (Java/C++)', 'coefficient' => 3, 'filiere' => 'DI', 'niveau' => 'L2'],
            ['nom_matiere' => 'Algorithmique Avancée', 'coefficient' => 3, 'filiere' => 'DI', 'niveau' => 'L2'],
            ['nom_matiere' => 'Frameworks Web (Laravel/Angular)', 'coefficient' => 3, 'filiere' => 'DI', 'niveau' => 'L3'],
            ['nom_matiere' => 'Conception d\'Applications', 'coefficient' => 2, 'filiere' => 'DI', 'niveau' => 'L3'],

            // RT (Réseaux & Télécoms)
            ['nom_matiere' => 'Réseaux & Télécommunications', 'coefficient' => 2, 'filiere' => 'RT', 'niveau' => 'L1'],
            ['nom_matiere' => 'Administration Système (Linux)', 'coefficient' => 3, 'filiere' => 'RT', 'niveau' => 'L2'],
            ['nom_matiere' => 'Sécurité Informatique', 'coefficient' => 3, 'filiere' => 'RT', 'niveau' => 'L3'],
            ['nom_matiere' => 'Protocoles Réseaux', 'coefficient' => 3, 'filiere' => 'RT', 'niveau' => 'L2'],
            ['nom_matiere' => 'Télécommunications Fondamentales', 'coefficient' => 2, 'filiere' => 'RT', 'niveau' => 'L1'],

            // FC (Finance Comptabilité)
            ['nom_matiere' => 'Comptabilité Analytique', 'coefficient' => 3, 'filiere' => 'FC', 'niveau' => 'L2'],
            ['nom_matiere' => 'Finance d\'Entreprise', 'coefficient' => 3, 'filiere' => 'FC', 'niveau' => 'L2'],
            ['nom_matiere' => 'Fiscalité des Entreprises', 'coefficient' => 2, 'filiere' => 'FC', 'niveau' => 'L3'],
            ['nom_matiere' => 'Contrôle de Gestion', 'coefficient' => 3, 'filiere' => 'FC', 'niveau' => 'L3'],
            ['nom_matiere' => 'Audit Financier', 'coefficient' => 3, 'filiere' => 'FC', 'niveau' => 'L3'],

            // GRH (Gestion des Ressources Humaines)
            ['nom_matiere' => 'Gestion des Talents', 'coefficient' => 3, 'filiere' => 'GRH', 'niveau' => 'L2'],
            ['nom_matiere' => 'Droit du Travail', 'coefficient' => 2, 'filiere' => 'GRH', 'niveau' => 'L2'],
            ['nom_matiere' => 'Recrutement & Intégration', 'coefficient' => 3, 'filiere' => 'GRH', 'niveau' => 'L1'],
            ['nom_matiere' => 'Management des Organisations', 'coefficient' => 3, 'filiere' => 'GRH', 'niveau' => 'L1'],
            ['nom_matiere' => 'Communication Interpersonnelle', 'coefficient' => 2, 'filiere' => 'GRH', 'niveau' => 'L1'],

            // BA (Banking & Administration)
            ['nom_matiere' => 'Économie Monétaire', 'coefficient' => 3, 'filiere' => 'BA', 'niveau' => 'L1'],
            ['nom_matiere' => 'Opérations Bancaires', 'coefficient' => 3, 'filiere' => 'BA', 'niveau' => 'L2'],
            ['nom_matiere' => 'Gestion de Portefeuille', 'coefficient' => 3, 'filiere' => 'BA', 'niveau' => 'L3'],
            ['nom_matiere' => 'Droit Bancaire', 'coefficient' => 2, 'filiere' => 'BA', 'niveau' => 'L2'],
            ['nom_matiere' => 'Marketing des Services Financiers', 'coefficient' => 2, 'filiere' => 'BA', 'niveau' => 'L3']
        ];

        foreach ($matieres as $m) {
            Matiere::create($m);
        }
    }
}
