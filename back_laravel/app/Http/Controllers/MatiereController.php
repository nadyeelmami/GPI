<?php

namespace App\Http\Controllers;

use App\Models\Matiere;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MatiereController extends Controller
{
    // Lister toutes les matières
    public function index()
    {
        $matieres = Matiere::orderBy('filiere')
            ->orderBy('nom_matiere')
            ->get();
        return response()->json($matieres, 200);
    }

    // Ajouter une matière
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_matiere' => 'required|string|max:191',
            'coefficient' => 'required|numeric|min:1',
            'filiere' => 'required|string|in:IG,FC,GRH,BA,DI,RT',
            'niveau' => 'required|string|in:L1,L2,L3,M1,M2'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // S'assurer que la matière est unique pour une même filière et un même niveau pour éviter les doublons
        $exists = Matiere::where('nom_matiere', $request->nom_matiere)
            ->where('filiere', $request->filiere)
            ->where('niveau', $request->niveau)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Cette matière existe déjà pour cette filière et ce niveau.'
            ], 422);
        }

        $matiere = Matiere::create($request->all());

        return response()->json([
            'message' => 'Matière créée avec succès !',
            'matiere' => $matiere
        ], 201);
    }

    // Modifier une matière
    public function update(Request $request, $id)
    {
        $matiere = Matiere::find($id);
        if (!$matiere) {
            return response()->json(['message' => 'Matière introuvable'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nom_matiere' => 'required|string|max:191',
            'coefficient' => 'required|numeric|min:1',
            'filiere' => 'required|string|in:IG,FC,GRH,BA,DI,RT',
            'niveau' => 'required|string|in:L1,L2,L3,M1,M2'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // S'assurer de l'unicité (exclure l'enregistrement actuel)
        $exists = Matiere::where('nom_matiere', $request->nom_matiere)
            ->where('filiere', $request->filiere)
            ->where('niveau', $request->niveau)
            ->where('id', '!=', $id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Cette matière existe déjà pour cette filière et ce niveau.'
            ], 422);
        }

        $matiere->update($request->all());

        return response()->json([
            'message' => 'Matière mise à jour avec succès !',
            'matiere' => $matiere
        ], 200);
    }

    // Supprimer une matière
    public function destroy($id)
    {
        $matiere = Matiere::find($id);
        if (!$matiere) {
            return response()->json(['message' => 'Matière introuvable'], 404);
        }
        $matiere->delete();
        return response()->json(['message' => 'Matière supprimée'], 200);
    }
}
