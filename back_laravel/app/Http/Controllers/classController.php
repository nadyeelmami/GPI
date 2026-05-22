<?php

namespace App\Http\Controllers;

use App\Models\Classe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

// On écrit "extends Controller" pour dire qu'il utilise la base existante
class ClasseController extends Controller
{
    // Fonction pour lister toutes les classes
    public function index()
    {
        return response()->json(Classe::all(), 200);
    }

    // Fonction pour enregistrer une nouvelle classe
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_classe' => 'required|string|max:191',
            'niveau' => 'required|string',
            'annee_scolaire' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $classe = Classe::create($request->all());

        return response()->json([
            'message' => 'Classe créée avec succès !',
            'classe' => $classe
        ], 201);
    }

    // Fonction pour supprimer une classe
    public function destroy($id)
    {
        $classe = Classe::find($id);
        if (!$classe) {
            return response()->json(['message' => 'Classe introuvable'], 404);
        }
        $classe->delete();
        return response()->json(['message' => 'Classe supprimée'], 200);
    }
}