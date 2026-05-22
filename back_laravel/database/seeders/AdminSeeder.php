<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        User::updateOrCreate(
            ['email' => 'admin@iscae.mr'], // On vérifie l'existence de l'admin par son email
            [
                'name' => 'Administrateur',
                'password' => Hash::make('admin123'),
                'role' => 'admin'
            ]
        );
    }
}
