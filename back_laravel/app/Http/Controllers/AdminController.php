<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class AdminController extends Controller
{
    /**
     * Liste tous les utilisateurs.
     */
    public function index()
    {
        return response()->json(User::all());
    }

    /**
     * Met à jour le rôle d'un utilisateur.
     */
    public function updateRole(Request $request, $id)
    {
        $request->validate([
            'role' => 'required|in:etudiant,enseignant,admin'
        ]);

        $user = User::findOrFail($id);
        $user->role = $request->role;
        $user->save();

        return response()->json([
            'message' => 'Rôle mis à jour avec succès',
            'user' => $user
        ]);
    }
}
