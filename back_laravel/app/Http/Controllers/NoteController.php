<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Classe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class NoteController extends Controller
{
    /**
     * Get students in a class with their notes for a specific matiere.
     */
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'classe_id' => 'required|integer|exists:classes,id',
            'matiere_id' => 'required|integer|exists:matieres,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $classeId = $request->query('classe_id');
        $matiereId = $request->query('matiere_id');

        // Fetch students belonging to the class
        $classe = Classe::find($classeId);
        $students = $classe->students()->get();

        // Get notes for these students in this matiere
        $notes = DB::table('notes')
            ->where('matiere_id', $matiereId)
            ->whereIn('etudiant_id', $students->pluck('id'))
            ->get()
            ->groupBy('etudiant_id');

        $result = $students->map(function ($student) use ($notes) {
            $studentNotes = $notes->get($student->id, collect());
            
            $noteExamen = $studentNotes->firstWhere('type_evaluation', 'Examen');
            $noteDevoir = $studentNotes->firstWhere('type_evaluation', 'Devoir');

            return [
                'student_id' => $student->id,
                'name' => $student->name,
                'matricule' => $student->matricule,
                'email' => $student->email,
                'note_examen' => $noteExamen ? $noteExamen->valeur_note : null,
                'note_devoir' => $noteDevoir ? $noteDevoir->valeur_note : null,
                'statut_validation' => ($noteExamen && $noteExamen->statut_validation == 1 && $noteDevoir && $noteDevoir->statut_validation == 1) ? 1 : 0,
            ];
        });

        return response()->json($result, 200);
    }

    /**
     * Store notes as drafts (statut_validation = 0).
     */
    public function store(Request $request)
    {
        return $this->saveGrades($request, 0);
    }

    /**
     * Publish notes (statut_validation = 1).
     */
    public function publish(Request $request)
    {
        return $this->saveGrades($request, 1);
    }

    /**
     * Helper to save grades.
     */
    private function saveGrades(Request $request, $status)
    {
        $validator = Validator::make($request->all(), [
            'matiere_id' => 'required|integer|exists:matieres,id',
            'prof_id' => 'required|integer|exists:users,id',
            'grades' => 'required|array',
            'grades.*.student_id' => 'required|integer|exists:users,id',
            'grades.*.valeur_note' => 'nullable|numeric|min:0|max:20',
            'grades.*.type_evaluation' => 'required|string|in:Examen,Devoir',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $matiereId = $request->input('matiere_id');
        $profId = $request->input('prof_id');
        $grades = $request->input('grades');

        DB::beginTransaction();
        try {
            foreach ($grades as $gradeData) {
                $studentId = $gradeData['student_id'];
                $valeurNote = $gradeData['valeur_note'];
                $typeEvaluation = $gradeData['type_evaluation'];

                if ($valeurNote === null || $valeurNote === '') {
                    // Delete note if it's null and not validated/published
                    DB::table('notes')
                        ->where('etudiant_id', $studentId)
                        ->where('matiere_id', $matiereId)
                        ->where('type_evaluation', $typeEvaluation)
                        ->where('statut_validation', 0)
                        ->delete();
                    continue;
                }

                // Check if notes are already validated
                $existingNote = DB::table('notes')
                    ->where('etudiant_id', $studentId)
                    ->where('matiere_id', $matiereId)
                    ->where('type_evaluation', $typeEvaluation)
                    ->first();

                if ($existingNote && $existingNote->statut_validation == 1) {
                    // Skip if note was already published
                    continue;
                }

                DB::table('notes')->updateOrInsert(
                    [
                        'etudiant_id' => $studentId,
                        'matiere_id' => $matiereId,
                        'type_evaluation' => $typeEvaluation,
                    ],
                    [
                        'prof_id' => $profId,
                        'valeur_note' => $valeurNote,
                        'statut_validation' => $status,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
            DB::commit();

            $msg = $status === 1 ? 'Notes publiées avec succès !' : 'Notes enregistrées en brouillon avec succès !';
            return response()->json(['message' => $msg], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Une erreur est survenue lors de l\'enregistrement : ' . $e->getMessage()], 500);
        }
    }
}
