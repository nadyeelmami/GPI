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
                    // Fetch subjects of this filiere and level
                    $matieres = DB::table('matieres')
                        ->where('filiere', $filiere)
                        ->where(function($q) use ($classe) {
                            $q->where('niveau', $classe->niveau)->orWhereNull('niveau');
                        })
                        ->get();
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
        if ($request->role === 'etudiant' && $request->filled('matricule')) {
            $matricule = trim($request->matricule);
            $request->merge([
                'email' => $matricule . '@etu.iscae.mr',
                'password' => $request->password ?: ($matricule . 'iscae')
            ]);
        } else if ($request->role === 'enseignant' && $request->filled('name')) {
            $name = trim($request->name);
            $slug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name));
            if (empty($slug)) {
                $slug = 'prof';
            }
            $request->merge([
                'email' => $slug . '@prof.iscae.mr',
                'password' => $request->password ?: ($slug . 'iscae')
            ]);
        }

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
            $name = trim($request->name);
            $slug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name));
            if (empty($slug)) {
                $slug = 'prof';
            }
            $userData['password'] = Hash::make($request->password ?: ($slug . 'iscae'));
        } else if ($request->role === 'etudiant') {
            $matricule = $request->matricule ?: 'etudiant';
            $userData['password'] = Hash::make($request->password ?: ($matricule . 'iscae'));
        } else {
            // Admin or fallback
            $userData['password'] = Hash::make($request->password ?: 'adminiscae');
        }

        $user = User::create($userData);

        if ($request->role === 'etudiant') {
            if ($request->filled('classe_id')) {
                $user->classes()->attach($request->classe_id);
            }
        } else if ($request->role === 'enseignant') {
            if ($request->filled('classe_ids') && $request->filled('matiere_ids')) {
                $classe_ids = is_array($request->classe_ids) ? $request->classe_ids : [$request->classe_ids];
                $matiere_ids = is_array($request->matiere_ids) ? $request->matiere_ids : [$request->matiere_ids];
                foreach ($classe_ids as $cid) {
                    foreach ($matiere_ids as $mid) {
                        Affectation::where('classe_id', $cid)->where('matiere_id', $mid)->delete();
                        Affectation::create([
                            'user_id' => $user->id,
                            'classe_id' => $cid,
                            'matiere_id' => $mid,
                        ]);
                    }
                }
            }
        }

        $user->load(['classes', 'affectations.classe', 'affectations.matiere']);

        return response()->json([
            'message' => 'Utilisateur créé avec succès !',
            'user' => $user
        ], 201);
    }

    /**
     * Bulk create a promo/batch of students.
     */
    public function storePromo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'matricule_debut' => 'required|string|max:191',
            'matricule_fin' => 'required|string|max:191',
            'classe_id' => 'required|integer|exists:classes,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $startStr = trim($request->matricule_debut);
        $endStr = trim($request->matricule_fin);
        $classeId = $request->classe_id;

        // Parse starting matricule
        if (!preg_match('/^([a-zA-Z_-]*)([0-9]+)$/', $startStr, $startMatches)) {
            return response()->json(['message' => 'Le matricule de début doit se terminer par des chiffres.'], 422);
        }
        
        // Parse ending matricule
        if (!preg_match('/^([a-zA-Z_-]*)([0-9]+)$/', $endStr, $endMatches)) {
            return response()->json(['message' => 'Le matricule de fin doit se terminer par des chiffres.'], 422);
        }

        $prefixStart = $startMatches[1];
        $numStartStr = $startMatches[2];
        $numStart = intval($numStartStr);

        $prefixEnd = $endMatches[1];
        $numEndStr = $endMatches[2];
        $numEnd = intval($numEndStr);

        if (strtolower($prefixStart) !== strtolower($prefixEnd)) {
            return response()->json(['message' => 'Les préfixes des matricules de début et de fin ne correspondent pas.'], 422);
        }

        if ($numStart > $numEnd) {
            return response()->json(['message' => 'Le matricule de début doit être inférieur ou égal au matricule de fin.'], 422);
        }

        // Limit the batch size
        $count = $numEnd - $numStart + 1;
        if ($count > 100) {
            return response()->json(['message' => 'La taille de la promotion ne peut pas dépasser 100 étudiants à la fois.'], 422);
        }

        $createdCount = 0;
        $skippedCount = 0;
        $studentsCreated = [];

        // Width for padding (e.g. 001 has length 3)
        $paddingWidth = strlen($numStartStr);

        DB::beginTransaction();
        try {
            for ($i = $numStart; $i <= $numEnd; $i++) {
                $paddedNum = str_pad($i, $paddingWidth, '0', STR_PAD_LEFT);
                $matricule = $prefixStart . $paddedNum;
                $email = strtolower($matricule) . '@etu.iscae.mr';

                // Check if matricule or email already exists
                $exists = User::where('matricule', $matricule)->orWhere('email', $email)->exists();
                if ($exists) {
                    $skippedCount++;
                    continue;
                }

                $rawPassword = $matricule . 'iscae';
                $student = User::create([
                    'name' => 'Étudiant ' . $matricule,
                    'email' => $email,
                    'matricule' => $matricule,
                    'password' => Hash::make($rawPassword),
                    'role' => 'etudiant',
                ]);

                // Sync with the class
                $student->classes()->sync([$classeId]);

                $studentsCreated[] = $student;
                $createdCount++;
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Une erreur est survenue lors de la création en masse : ' . $e->getMessage()], 500);
        }

        return response()->json([
            'message' => "Création de la promotion terminée ! $createdCount étudiants créés, $skippedCount ignorés (déjà existants).",
            'count_created' => $createdCount,
            'count_skipped' => $skippedCount,
            'students' => $studentsCreated
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

        if ($request->role === 'etudiant' && $request->filled('matricule')) {
            $matricule = trim($request->matricule);
            $request->merge([
                'email' => $matricule . '@etu.iscae.mr'
            ]);
        } else if ($request->role === 'enseignant' && $request->filled('name')) {
            $name = trim($request->name);
            $slug = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name));
            if (empty($slug)) {
                $slug = 'prof';
            }
            $request->merge([
                'email' => $slug . '@prof.iscae.mr'
            ]);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:191',
            'email' => 'required|string|email|max:191|unique:users,email,' . $id,
            'password' => 'nullable|string|min:4',
            'role' => 'required|string|in:etudiant,enseignant,admin',
            'matricule' => 'nullable|string|max:191|unique:users,matricule,' . $id,
            'classe_ids' => 'nullable|array',
            'matiere_ids' => 'nullable|array',
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
            
            if ($request->filled('classe_ids') && $request->filled('matiere_ids')) {
                Affectation::where('user_id', $user->id)->delete();
                $classe_ids = is_array($request->classe_ids) ? $request->classe_ids : [$request->classe_ids];
                $matiere_ids = is_array($request->matiere_ids) ? $request->matiere_ids : [$request->matiere_ids];
                foreach ($classe_ids as $cid) {
                    foreach ($matiere_ids as $mid) {
                        Affectation::where('classe_id', $cid)->where('matiere_id', $mid)->delete();
                        Affectation::create([
                            'user_id' => $user->id,
                            'classe_id' => $cid,
                            'matiere_id' => $mid,
                        ]);
                    }
                }
            } else if ($request->has('classe_ids')) {
                // If they explicitly clear it or send empty
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

        // Fetch all subjects (matieres) for this filiere and level, left-joining student grades if entered
        $notesQuery = DB::table('matieres')
            ->leftJoin('notes', function($join) use ($id) {
                $join->on('matieres.id', '=', 'notes.matiere_id')
                     ->where('notes.etudiant_id', '=', $id);
            })
            ->leftJoin('users as profs', 'notes.prof_id', '=', 'profs.id')
            ->where('matieres.filiere', $filiere);

        if ($classe) {
            $notesQuery->where(function($q) use ($classe) {
                $q->where('matieres.niveau', $classe->niveau)->orWhereNull('matieres.niveau');
            });
        }

        $notes = $notesQuery->select(
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

    /**
     * Update the password for a specific user.
     */
    public function updatePassword(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Utilisateur introuvable'], 404);
        }

        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:4'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json(['message' => 'Mot de passe mis à jour avec succès'], 200);
    }

    /**
     * Add an affectation to a teacher.
     */
    public function addAffectation(Request $request, $id)
    {
        $user = User::find($id);
        if (!$user || $user->role !== 'enseignant') {
            return response()->json(['message' => 'Enseignant introuvable'], 404);
        }

        $validator = Validator::make($request->all(), [
            'classe_id' => 'required|integer|exists:classes,id',
            'matiere_id' => 'required|integer|exists:matieres,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check if already assigned
        $exists = Affectation::where('user_id', $user->id)
            ->where('classe_id', $request->classe_id)
            ->where('matiere_id', $request->matiere_id)
            ->first();

        if ($exists) {
            return response()->json(['message' => 'Cette affectation existe déjà pour ce professeur'], 422);
        }

        Affectation::create([
            'user_id' => $user->id,
            'classe_id' => $request->classe_id,
            'matiere_id' => $request->matiere_id,
        ]);

        return response()->json(['message' => 'Affectation ajoutée avec succès'], 200);
    }

    /**
     * Remove an affectation from a teacher.
     */
    public function removeAffectation($id)
    {
        $affectation = Affectation::find($id);
        if (!$affectation) {
            return response()->json(['message' => 'Affectation introuvable'], 404);
        }

        $affectation->delete();

        return response()->json(['message' => 'Affectation supprimée avec succès'], 200);
    }
}
