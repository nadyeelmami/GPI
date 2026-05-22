import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  // Signaux d'état principal
  activeTab = signal<'classes' | 'students' | 'teachers' | 'bulletins'>('classes');
  message = signal<string | null>(null);

  // Données des listes
  classes = signal<any[]>([]);
  students = signal<any[]>([]);
  teachers = signal<any[]>([]);
  matieres = signal<any[]>([]);

  // Signal réactif pour suivre le choix de classe dans le formulaire d'enseignant
  selectedTeacherClasseId = signal<string>('');

  // Signal pour filtrer la classe dans l'onglet des bulletins
  selectedBulletinClasseId = signal<string>('');

  // Filtrer les étudiants pour l'onglet bulletins
  filteredStudentsForBulletins = computed(() => {
    const classId = this.selectedBulletinClasseId();
    const allStudents = this.students();
    if (!classId) return allStudents;
    return allStudents.filter(s => s.classes && s.classes.length > 0 && s.classes[0].id.toString() === classId.toString());
  });

  // Matières filtrées dynamiquement selon la filière de la classe sélectionnée
  filteredMatieres = computed(() => {
    const classId = this.selectedTeacherClasseId();
    if (!classId) return [];
    
    const selectedClass = this.classes().find(c => c.id.toString() === classId.toString());
    if (!selectedClass) return [];

    const nom = selectedClass.nom_classe.toUpperCase();
    let filiere = '';
    
    // Détection de la filière
    if (nom.includes('IG')) filiere = 'IG';
    else if (nom.includes('FC')) filiere = 'FC';
    else if (nom.includes('GRH')) filiere = 'GRH';
    else if (nom.includes('BA')) filiere = 'BA';
    else if (nom.includes('DI')) filiere = 'DI';
    else if (nom.includes('RT')) filiere = 'RT';
    else {
      // Fallbacks intelligents si le nom contient des mots-clés
      if (nom.includes('DEV') || nom.includes('DEVELOPPEMENT') || nom.includes('INFO')) filiere = 'DI';
      else if (nom.includes('FINANCE') || nom.includes('COMPTA')) filiere = 'FC';
      else if (nom.includes('RESEAU') || nom.includes('TELECOM')) filiere = 'RT';
      else if (nom.includes('RESSOURCES') || nom.includes('HUMAIN')) filiere = 'GRH';
      else filiere = nom;
    }

    return this.matieres().filter(m => m.filiere === filiere);
  });

  onClasseChange(val: any) {
    this.selectedTeacherClasseId.set(val);
    this.formTeacher.matiere_id = ''; // Réinitialise la matière
  }

  // Bulletin sélectionné
  selectedBulletin = signal<any | null>(null);
  showBulletinModal = signal<boolean>(false);
  todayStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // Données du formulaire de Classe
  formClasse = { 
    nom_classe: 'IG', // Filière par défaut
    niveau: 'L1', 
    annee_scolaire: '2025-2026' 
  };

  // Données du formulaire d'Étudiant
  formStudent = {
    id: null as number | null,
    name: '',
    email: '',
    matricule: '',
    password: '', // Optionnel, généré automatiquement si vide
    classe_id: ''
  };

  // Données du formulaire d'Enseignant
  formTeacher = {
    id: null as number | null,
    name: '',
    email: '',
    classe_id: '',
    matiere_id: '',
    password: '' // Optionnel, généré automatiquement si vide
  };

  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.refreshAll();
  }

  refreshAll() {
    this.refreshClasses();
    this.refreshStudents();
    this.refreshTeachers();
    this.refreshMatieres();
  }

  // --- MATIÈRE ---
  refreshMatieres() {
    this.http.get<any[]>(`${this.baseUrl}/matieres`).subscribe({
      next: (res) => this.matieres.set(res),
      error: () => this.showNotification('Erreur de connexion aux matières')
    });
  }

  // --- CLASSE ---
  refreshClasses() {
    this.http.get<any[]>(`${this.baseUrl}/classes`).subscribe({
      next: (res) => this.classes.set(res),
      error: () => this.showNotification('Erreur de connexion aux classes')
    });
  }

  saveClasse() {
    if (!this.formClasse.nom_classe) return;
    this.http.post(`${this.baseUrl}/classes`, this.formClasse).subscribe({
      next: () => {
        this.refreshClasses();
        this.showNotification('Classe ajoutée !');
      }
    });
  }

  deleteClasse(id: number) {
    if (confirm('Supprimer cette classe ?')) {
      this.http.delete(`${this.baseUrl}/classes/${id}`).subscribe(() => {
        this.refreshClasses();
        this.showNotification('Classe supprimée.');
      });
    }
  }

  // --- ÉTUDIANT ---
  refreshStudents() {
    this.http.get<any[]>(`${this.baseUrl}/users?role=etudiant`).subscribe({
      next: (res) => this.students.set(res),
      error: () => this.showNotification('Erreur de connexion aux étudiants')
    });
  }

  saveStudent() {
    if (!this.formStudent.name || !this.formStudent.email) {
      this.showNotification('Nom et Email requis.');
      return;
    }

    const payload: any = {
      name: this.formStudent.name,
      email: this.formStudent.email,
      role: 'etudiant',
      matricule: this.formStudent.matricule || null,
      classe_id: this.formStudent.classe_id ? parseInt(this.formStudent.classe_id) : null
    };

    if (this.formStudent.password) {
      payload.password = this.formStudent.password;
    }

    if (this.formStudent.id) {
      // Modification
      this.http.put(`${this.baseUrl}/users/${this.formStudent.id}`, payload).subscribe({
        next: () => {
          this.refreshStudents();
          this.resetStudentForm();
          this.showNotification('Étudiant modifié !');
        },
        error: (err) => this.showNotification(err.error?.message || 'Erreur lors de la modification.')
      });
    } else {
      // Ajout (Mot de passe auto généré par le backend s'il est vide)
      this.http.post(`${this.baseUrl}/users`, payload).subscribe({
        next: () => {
          this.refreshStudents();
          this.resetStudentForm();
          this.showNotification('Étudiant ajouté !');
        },
        error: (err) => this.showNotification(err.error?.message || 'Erreur lors de l\'ajout.')
      });
    }
  }

  editStudent(student: any) {
    this.formStudent.id = student.id;
    this.formStudent.name = student.name;
    this.formStudent.email = student.email;
    this.formStudent.matricule = student.matricule || '';
    this.formStudent.classe_id = student.classes && student.classes.length > 0 ? student.classes[0].id.toString() : '';
    this.formStudent.password = ''; // Laisse vide si pas de changement
  }

  deleteStudent(id: number) {
    if (confirm('Supprimer cet étudiant ?')) {
      this.http.delete(`${this.baseUrl}/users/${id}`).subscribe(() => {
        this.refreshStudents();
        this.showNotification('Étudiant supprimé.');
      });
    }
  }

  resetStudentForm() {
    this.formStudent = {
      id: null,
      name: '',
      email: '',
      matricule: '',
      password: '',
      classe_id: ''
    };
  }

  // --- ENSEIGNANT ---
  refreshTeachers() {
    this.http.get<any[]>(`${this.baseUrl}/users?role=enseignant`).subscribe({
      next: (res) => this.teachers.set(res),
      error: () => this.showNotification('Erreur de connexion aux enseignants')
    });
  }

  saveTeacher() {
    if (!this.formTeacher.name || !this.formTeacher.email) {
      this.showNotification('Nom et Email requis.');
      return;
    }

    const payload: any = {
      name: this.formTeacher.name,
      email: this.formTeacher.email,
      role: 'enseignant',
      classe_id: this.formTeacher.classe_id ? parseInt(this.formTeacher.classe_id) : null,
      matiere_id: this.formTeacher.matiere_id ? parseInt(this.formTeacher.matiere_id) : null
    };

    if (this.formTeacher.password) {
      payload.password = this.formTeacher.password;
    }

    if (this.formTeacher.id) {
      // Modification
      this.http.put(`${this.baseUrl}/users/${this.formTeacher.id}`, payload).subscribe({
        next: () => {
          this.refreshTeachers();
          this.resetTeacherForm();
          this.showNotification('Enseignant modifié !');
        },
        error: (err) => this.showNotification(err.error?.message || 'Erreur lors de la modification.')
      });
    } else {
      // Ajout (Mot de passe auto généré par le backend s'il est vide)
      this.http.post(`${this.baseUrl}/users`, payload).subscribe({
        next: () => {
          this.refreshTeachers();
          this.resetTeacherForm();
          this.showNotification('Enseignant ajouté !');
        },
        error: (err) => this.showNotification(err.error?.message || 'Erreur lors de l\'ajout.')
      });
    }
  }

  editTeacher(teacher: any) {
    this.formTeacher.id = teacher.id;
    this.formTeacher.name = teacher.name;
    this.formTeacher.email = teacher.email;
    const classId = teacher.affectations && teacher.affectations.length > 0 ? teacher.affectations[0].classe_id.toString() : '';
    this.formTeacher.classe_id = classId;
    this.selectedTeacherClasseId.set(classId); // Mettre à jour le signal réactif
    this.formTeacher.matiere_id = teacher.affectations && teacher.affectations.length > 0 ? teacher.affectations[0].matiere_id.toString() : '';
    this.formTeacher.password = ''; // Laisse vide si pas de changement
  }

  deleteTeacher(id: number) {
    if (confirm('Supprimer cet enseignant ?')) {
      this.http.delete(`${this.baseUrl}/users/${id}`).subscribe(() => {
        this.refreshTeachers();
        this.showNotification('Enseignant supprimé.');
      });
    }
  }

  resetTeacherForm() {
    this.formTeacher = {
      id: null,
      name: '',
      email: '',
      classe_id: '',
      matiere_id: '',
      password: ''
    };
    this.selectedTeacherClasseId.set(''); // Réinitialiser le signal réactif
  }

  // --- BULLETINS ---
  generateBulletin(studentId: number) {
    this.http.get<any>(`${this.baseUrl}/users/${studentId}/bulletin`).subscribe({
      next: (res) => {
        // Si l'étudiant n'a pas encore de notes réelles enregistrées par l'enseignant, on simule de magnifiques notes pour la démonstration
        if (!res.has_grades) {
          res.notes = [
            { nom_matiere: 'Algorithmique & Structures de Données', coefficient: 3, valeur_note: 14.50, type_evaluation: 'Examen', prof_name: 'Dr. Mohamed Lemine' },
            { nom_matiere: 'Architecture des Ordinateurs', coefficient: 2, valeur_note: 12.00, type_evaluation: 'Examen', prof_name: 'Dr. Professeur prof' },
            { nom_matiere: 'Bases de Données Relationnelles', coefficient: 3, valeur_note: 16.25, type_evaluation: 'Examen', prof_name: 'Dr. Mohamed Lemine' },
            { nom_matiere: 'Réseaux & Télécommunications', coefficient: 2, valeur_note: 10.50, type_evaluation: 'Examen', prof_name: 'Dr. Professeur prof' },
            { nom_matiere: 'Anglais Technique', coefficient: 1, valeur_note: 15.00, type_evaluation: 'Examen', prof_name: 'Mme. Mint Sidi' }
          ];
          res.isMock = true;
          
          // Calculer la moyenne générale pour les données simulées
          let totalPoints = 0;
          let totalCoefficients = 0;
          res.notes.forEach((n: any) => {
            totalPoints += parseFloat(n.valeur_note) * n.coefficient;
            totalCoefficients += n.coefficient;
          });
          res.moyenneG = totalCoefficients > 0 ? (totalPoints / totalCoefficients) : 0;

          // Assigner la mention
          if (res.moyenneG >= 16) res.mention = 'Très Bien';
          else if (res.moyenneG >= 14) res.mention = 'Bien';
          else if (res.moyenneG >= 12) res.mention = 'Assez Bien';
          else if (res.moyenneG >= 10) res.mention = 'Passable';
          else res.mention = 'Ajourné';
        }

        this.selectedBulletin.set(res);
        this.showBulletinModal.set(true);
      },
      error: () => this.showNotification('Impossible de charger le bulletin de l\'étudiant.')
    });
  }

  togglePublishBulletin() {
    const bulletin = this.selectedBulletin();
    if (!bulletin || !bulletin.student) return;

    const studentId = bulletin.student.id;
    const currentStatus = bulletin.student.bulletin_publie === 1 || bulletin.student.bulletin_publie === true;
    const newStatus = !currentStatus;

    this.http.post(`${this.baseUrl}/users/${studentId}/publish-bulletin`, { publish: newStatus }).subscribe({
      next: (res: any) => {
        this.showNotification(res.message);
        
        // Update local state in the selectedBulletin signal
        const updated = { ...bulletin };
        updated.student = { ...updated.student, bulletin_publie: res.bulletin_publie ? 1 : 0 };
        this.selectedBulletin.set(updated);

        // Also update the students list so the table updates dynamically
        this.students.update(list => list.map(s => {
          if (s.id === studentId) {
            return { ...s, bulletin_publie: res.bulletin_publie ? 1 : 0 };
          }
          return s;
        }));
      },
      error: () => this.showNotification('Impossible de modifier le statut de publication du bulletin.')
    });
  }

  closeBulletin() {
    this.showBulletinModal.set(false);
    this.selectedBulletin.set(null);
  }

  printBulletin() {
    window.print();
  }

  // --- UTILS ---
  selectTab(tab: 'classes' | 'students' | 'teachers' | 'bulletins') {
    this.activeTab.set(tab);
  }

  showNotification(msg: string) {
    this.message.set(msg);
    setTimeout(() => this.message.set(null), 3000);
  }
}