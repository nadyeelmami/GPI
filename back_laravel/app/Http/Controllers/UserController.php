<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Classe;
use App\Models\Matiere;
use App\Models\Affectation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /**
     * Display a listing of users, optionally filtered by role.
     */
    public function index(Request $request)
    {
        $role = $request->query('role');
        
        $query = User::query();
        
        if ($role) {
            $query->where('role', $role);
        }
        
        if ($role === 'etudiant') {
            $users = $query->with(['classes'])->get();
            
            // Loop through students to calculate their average on WAMP backend automatically
            foreach ($users as $student) {
                // Determine filiere
                $classe = $student->classes->first();
                $filiere = null;
                if ($classe) {
                    $nom = strtoupper($classe->nom_classe);
                    if (str_contains($nom, 'IG')) $filiere = 'IG';
                    elseif (str_contains($nom, 'FC')) $filiere = 'FC';
                    elseif (str_contains($nom, 'GRH')) $filiere = 'GRH';
                    elseif (str_contains($nom, 'BA')) $filiere = 'BA';
                    elseif (str_contains($nom, 'DI')) $filiere = 'DI';
                    elseif (str_contains($nom, 'RT')) $filiere = 'RT';
                    else {
                        if (str_contains($nom, 'DEV') || str_contains($nom, 'DEVELOPPEMENT') || str_contains($nom, 'INFO')) $filiere = 'DI';
                        elseif (str_contains($nom, 'FINANCE') || str_contains($nom, 'COMPTA')) $filiere = 'FC';
                        elseif (str_contains($nom, 'RESEAU') || str_contains($nom, 'TELECOM')) $filiere = 'RT';
                        elseif (str_contains($nom, 'RESSOURCES') || str_contains($nom, 'HUMAIN')) $filiere = 'GRH';
                        else $filiere = $nom;
                    }
                }

                if ($filiere) {
                    // Fetch subjects of this filiere
                    $matieres = DB::table('matieres')->where('filiere', $filiere)->get();
                    $studentNotes = DB::table('notes')
                        ->where('etudiant_id', $student->id)
                        ->get()
                        ->keyBy('matiere_id');

                    $totalPoints = 0;
                    $totalCoefficients = 0;
                    $hasAnyGrade = false;

                    foreach ($matieres as $matiere) {
                        $note = $studentNotes->get($matiere->id);
                        if ($note && $note->valeur_note !== null) {
                            $totalPoints += floatval($note->valeur_note) * $matiere->coefficient;
                            $totalCoefficients += $matiere->coefficient;
                            $hasAnyGrade = true;
                        }
                    }

                    if ($hasAnyGrade && $totalCoefficients > 0) {
                        $student->moyenneG = round($totalPoints / $totalCoefficients, 2);
                        
                        // Mentions
                        if ($student->moyenneG >= 16) $student->mention = 'Très Bien';
                        elseif ($student->moyenneG >= 14) $student->mention = 'Bien';
                        elseif ($student->moyenneG >= 12) $student->mention = 'Assez Bien';
                        elseif ($student->moyenneG >= 10) $student->mention = 'Passable';
                        else $student->mention = 'Ajourné';
                    }
                }
            }
        } else {
            // Eager load classes for students, and affectations (with classe and matiere) for teachers
            $users = $query->with(['classes', 'affectations.classe', 'affectations.matiere'])->get();
        }
        
        return response()->json($users, 200);
    }

    /**
     * Store a newly created user in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:191',
            'email' => 'required|string|email|max:191|unique:users',
            'password' => 'nullable|string|min:4',
            'role' => 'required|string|in:etudiant,enseignant,admin',
            'matricule' => 'nullable|string|max:191|unique:users,matricule',
            'classe_id' => 'nullable|integer|exists:classes,id',
            'matiere_id' => 'nullable|integer|exists:matieres,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $userData = $request->only(['name', 'email', 'role', 'matricule']);
        
        // Automatic password assignment
        if ($request->role === 'enseignant') {
            $userData['password'] = Hash::make('profiscae');
        } else if ($request->role === 'etudiant') {
            $matricule = $request->matricule ?: 'etudiant';
            $userData['password'] = Hash::make($matricule . 'iscae');
        } else {
            // Admin or fallback
            $userData['password'] = Hash::make($request->password ?: 'adminiscae');
        }

        $user = User::create($userData);

        if ($request->role === 'etudiant' && $request->filled('classe_id')) {
            $user->classes()->sync([$request->classe_id]);
        }

        if ($request->role === 'enseignant' && $request->filled('classe_id') && $request->filled('matiere_id')) {
            Affectation::create([
                'user_id' => $user->id,
                'classe_id' => $request->classe_id,
                'matiere_id' => $request->matiere_id,
            ]);
        }

        // Load the relations for the response
        $user->load(['classes', 'affectations.classe', 'affectations.matiere']);

        return response()->json([
            'message' => 'Utilisateur créé avec succès !',
            'user' => $user
        ], 201);
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Utilisateur introuvable'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:191',
            'email' => 'required|string|email|max:191|unique:users,email,' . $id,
            'password' => 'nullable|string|min:4',
            'role' => 'required|string|in:etudiant,enseignant,admin',
            'matricule' => 'nullable|string|max:191|unique:users,matricule,' . $id,
            'classe_id' => 'nullable|integer|exists:classes,id',
            'matiere_id' => 'nullable|integer|exists:matieres,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $userData = $request->only(['name', 'email', 'role', 'matricule']);
        
        // If password is explicitly changed, we hash and update it
        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }

        $user->update($userData);

        if ($request->role === 'etudiant') {
            if ($request->filled('classe_id')) {
                $user->classes()->sync([$request->classe_id]);
            } else {
                $user->classes()->detach();
            }
            // Clear any teacher affectations if role changed to student
            Affectation::where('user_id', $user->id)->delete();
        } else if ($request->role === 'enseignant') {
            // Remove student class associations
            $user->classes()->detach();

            if ($request->filled('classe_id') && $request->filled('matiere_id')) {
                // Delete previous affectation(s) to match the single assignment logic of the UI form
                Affectation::where('user_id', $user->id)->delete();
                Affectation::create([
                    'user_id' => $user->id,
                    'classe_id' => $request->classe_id,
                    'matiere_id' => $request->matiere_id,
                ]);
            } else {
                Affectation::where('user_id', $user->id)->delete();
            }
        } else {
            // If admin, detach everything
            $user->classes()->detach();
            Affectation::where('user_id', $user->id)->delete();
        }

        $user->load(['classes', 'affectations.classe', 'affectations.matiere']);

        return response()->json([
            'message' => 'Utilisateur mis à jour avec succès !',
            'user' => $user
        ], 200);
    }

    /**
     * Remove the specified user from storage.
     */
    public function destroy($id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Utilisateur introuvable'], 404);
        }

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé avec succès !'], 200);
    }

    /**
     * Retrieve grades and details of a student for generating their report card (bulletin).
     * Calculates the average automatically using filiere-specific coefficients and real teacher grades.
     */
    public function bulletin($id)
    {
        $student = User::with('classes')->find($id);
        if (!$student || $student->role !== 'etudiant') {
            return response()->json(['message' => 'Étudiant introuvable'], 404);
        }

        // Determine the student's filiere based on their class name
        $classe = $student->classes->first();
        $filiere = 'IG'; // Default fallback
        if ($classe) {
            $nom = strtoupper($classe->nom_classe);
            if (str_contains($nom, 'IG')) $filiere = 'IG';
            elseif (str_contains($nom, 'FC')) $filiere = 'FC';
            elseif (str_contains($nom, 'GRH')) $filiere = 'GRH';
            elseif (str_contains($nom, 'BA')) $filiere = 'BA';
            elseif (str_contains($nom, 'DI')) $filiere = 'DI';
            elseif (str_contains($nom, 'RT')) $filiere = 'RT';
            else {
                if (str_contains($nom, 'DEV') || str_contains($nom, 'DEVELOPPEMENT') || str_contains($nom, 'INFO')) $filiere = 'DI';
                elseif (str_contains($nom, 'FINANCE') || str_contains($nom, 'COMPTA')) $filiere = 'FC';
                elseif (str_contains($nom, 'RESEAU') || str_contains($nom, 'TELECOM')) $filiere = 'RT';
                elseif (str_contains($nom, 'RESSOURCES') || str_contains($nom, 'HUMAIN')) $filiere = 'GRH';
                else $filiere = $nom;
            }
        }

        // Fetch all subjects (matieres) for this filiere, left-joining student grades if entered
        $notes = DB::table('matieres')
            ->leftJoin('notes', function($join) use ($id) {
                $join->on('matieres.id', '=', 'notes.matiere_id')
                     ->where('notes.etudiant_id', '=', $id);
            })
            ->leftJoin('users as profs', 'notes.prof_id', '=', 'profs.id')
            ->where('matieres.filiere', $filiere)
            ->select(
                'matieres.nom_matiere',
                'matieres.coefficient',
                'notes.valeur_note',
                'notes.type_evaluation',
                'notes.statut_validation',
                'profs.name as prof_name'
            )
            ->get();

        $totalPoints = 0;
        $totalCoefficients = 0;
        $hasAnyGrade = false;
        
        $formattedNotes = [];
        foreach ($notes as $n) {
            $valeurNote = $n->valeur_note !== null ? floatval($n->valeur_note) : null;
            if ($valeurNote !== null) {
                $totalPoints += $valeurNote * $n->coefficient;
                $totalCoefficients += $n->coefficient;
                $hasAnyGrade = true;
            }
            
            $formattedNotes[] = [
                'nom_matiere' => $n->nom_matiere,
                'coefficient' => intval($n->coefficient),
                'valeur_note' => $valeurNote,
                'type_evaluation' => $n->type_evaluation ?: 'Examen',
                'statut_validation' => $n->statut_validation !== null ? intval($n->statut_validation) : 0,
                'prof_name' => $n->prof_name ?: 'Non assigné'
            ];
        }

        $moyenneG = $totalCoefficients > 0 ? ($totalPoints / $totalCoefficients) : 0;
        
        // Assign the mention based on academic standard
        if (!$hasAnyGrade) {
            $mention = 'Pas de notes';
        } elseif ($moyenneG >= 16) {
            $mention = 'Très Bien';
        } elseif ($moyenneG >= 14) {
            $mention = 'Bien';
        } elseif ($moyenneG >= 12) {
            $mention = 'Assez Bien';
        } elseif ($moyenneG >= 10) {
            $mention = 'Passable';
        } else {
            $mention = 'Ajourné';
        }

        return response()->json([
            'student' => $student,
            'notes' => $formattedNotes,
            'moyenneG' => $moyenneG,
            'mention' => $mention,
            'has_grades' => $hasAnyGrade
        ], 200);
    }

    /**
     * Retrieve a specific user with relationships.
     */
    public function show($id)
    {
        $user = User::with(['classes', 'affectations.classe', 'affectations.matiere'])->find($id);
        if (!$user) {
            return response()->json(['message' => 'Utilisateur introuvable'], 404);
        }
        return response()->json($user, 200);
    }

    /**
     * Publish or unpublish a student's bulletin.
     */
    public function publishBulletin(Request $request, $id)
    {
        $student = User::find($id);
        if (!$student || $student->role !== 'etudiant') {
            return response()->json(['message' => 'Étudiant introuvable'], 404);
        }

        $publish = $request->input('publish', true);
        $student->bulletin_publie = $publish;
        $student->save();

        return response()->json([
            'message' => $publish ? 'Bulletin publié avec succès !' : 'Publication du bulletin annulée.',
            'bulletin_publie' => $student->bulletin_publie
        ], 200);
    }
}
