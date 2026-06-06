import { Component, OnInit, signal, computed, HostListener } from '@angular/core';
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

  selectedTeacherClasseIds = signal<string[]>([]);

  // Matières filtrées dynamiquement pour le formTeacher
  filteredMatieres = computed(() => {
    const classIds = this.selectedTeacherClasseIds();
    if (!classIds || classIds.length === 0) return [];
    
    const selectedClasses = this.classes().filter(c => classIds.includes(c.id.toString()) || classIds.includes(c.id));
    if (selectedClasses.length === 0) return [];

    return this.matieres().filter(m => 
      selectedClasses.some(c => m.filiere === c.nom_classe && (!m.niveau || m.niveau === c.niveau))
    );
  });

  onClasseChange(val: any) {
    this.formTeacher.matiere_ids = [];
  }

  // Bulletin sélectionné
  selectedBulletin = signal<any | null>(null);
  showBulletinModal = signal<boolean>(false);
  todayStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // Custom Dropdown States
  isClassesDropdownOpen = signal<boolean>(false);
  isMatieresDropdownOpen = signal<boolean>(false);

  
  // Données du formulaire de Classe
  formClasse = { 
    nom_classe: 'IG', // Filière par défaut
    niveau: 'L1', 
    annee_scolaire: '2025-2026' 
  };

  // Données du formulaire de Matière
  formMatiere = {
    id: null as number | null,
    nom_matiere: '',
    coefficient: 1,
    filiere: 'IG',
    niveau: 'L1'
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

  // Données du formulaire de Promotion d'Étudiants
  formPromo = {
    matricule_debut: '',
    matricule_fin: '',
    classe_id: ''
  };

  // Données du formulaire d'Enseignant
  formTeacher = {
    id: null as number | null,
    name: '',
    email: '',
    password: '',
    classe_ids: [] as string[],
    matiere_ids: [] as string[]
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

  saveMatiere() {
    if (!this.formMatiere.nom_matiere || !this.formMatiere.coefficient) {
      this.showNotification('Nom et coefficient requis.');
      return;
    }

    if (this.formMatiere.id) {
      // Modification
      this.http.put(`${this.baseUrl}/matieres/${this.formMatiere.id}`, this.formMatiere).subscribe({
        next: () => {
          this.refreshMatieres();
          this.resetMatiereForm();
          this.showNotification('Matière modifiée !');
        },
        error: (err) => this.showNotification(err.error?.message || 'Erreur lors de la modification de la matière.')
      });
    } else {
      // Ajout
      this.http.post(`${this.baseUrl}/matieres`, this.formMatiere).subscribe({
        next: () => {
          this.refreshMatieres();
          this.resetMatiereForm();
          this.showNotification('Matière ajoutée !');
        },
        error: (err) => this.showNotification(err.error?.message || 'Erreur lors de l\'ajout de la matière.')
      });
    }
  }

  editMatiere(matiere: any) {
    this.formMatiere.id = matiere.id;
    this.formMatiere.nom_matiere = matiere.nom_matiere;
    this.formMatiere.coefficient = matiere.coefficient;
    this.formMatiere.filiere = matiere.filiere;
    this.formMatiere.niveau = matiere.niveau || 'L1';

    // Fait défiler la page vers le haut pour afficher le formulaire
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  deleteMatiere(id: number) {
    if (confirm('Supprimer cette matière ?')) {
      this.http.delete(`${this.baseUrl}/matieres/${id}`).subscribe({
        next: () => {
          this.refreshMatieres();
          if (this.formMatiere.id === id) {
            this.resetMatiereForm();
          }
          this.showNotification('Matière supprimée.');
        },
        error: (err) => this.showNotification(err.error?.message || 'Erreur lors de la suppression de la matière.')
      });
    }
  }

  resetMatiereForm() {
    this.formMatiere = {
      id: null,
      nom_matiere: '',
      coefficient: 1,
      filiere: 'IG',
      niveau: 'L1'
    };
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
      },
      error: (err) => {
        this.showNotification(err.error?.message || 'Erreur lors de l\'ajout de la classe.');
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
    if (!this.formStudent.name || !this.formStudent.matricule) {
      this.showNotification('Nom et Matricule requis.');
      return;
    }

    const payload: any = {
      name: this.formStudent.name,
      role: 'etudiant',
      matricule: this.formStudent.matricule || null,
      classe_id: this.formStudent.classe_id ? parseInt(this.formStudent.classe_id) : null
    };

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

    // Fait défiler la page vers le haut pour afficher le formulaire
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  savePromo() {
    if (!this.formPromo.matricule_debut || !this.formPromo.matricule_fin || !this.formPromo.classe_id) {
      this.showNotification('Tous les champs sont requis (Matricule début, fin et Classe).');
      return;
    }

    const payload = {
      matricule_debut: this.formPromo.matricule_debut,
      matricule_fin: this.formPromo.matricule_fin,
      classe_id: parseInt(this.formPromo.classe_id)
    };

    this.http.post(`${this.baseUrl}/users/promo`, payload).subscribe({
      next: (res: any) => {
        this.refreshStudents();
        this.resetPromoForm();
        this.showNotification(res.message || 'Promotion d\'étudiants créée avec succès !');
      },
      error: (err) => {
        this.showNotification(err.error?.message || 'Erreur lors de la création de la promotion.');
      }
    });
  }

  resetPromoForm() {
    this.formPromo = {
      matricule_debut: '',
      matricule_fin: '',
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
    if (!this.formTeacher.name) {
      this.showNotification('Nom complet requis.');
      return;
    }

    const payload: any = {
      name: this.formTeacher.name,
      role: 'enseignant',
      classe_ids: this.formTeacher.classe_ids.map(id => parseInt(id)),
      matiere_ids: this.formTeacher.matiere_ids.map(id => parseInt(id))
    };

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
    this.formTeacher.password = ''; // Laisse vide si pas de changement
    
    if (teacher.affectations && teacher.affectations.length > 0) {
      const cIds = Array.from(new Set(teacher.affectations.map((a: any) => a.classe_id.toString())));
      const mIds = Array.from(new Set(teacher.affectations.map((a: any) => a.matiere_id.toString())));
      this.formTeacher.classe_ids = cIds as string[];
      this.selectedTeacherClasseIds.set(cIds as string[]);
      this.formTeacher.matiere_ids = mIds as string[];
    } else {
      this.formTeacher.classe_ids = [];
      this.selectedTeacherClasseIds.set([]);
      this.formTeacher.matiere_ids = [];
    }

    // Fait défiler la page vers le haut pour afficher le formulaire
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
      password: '',
      classe_ids: [],
      matiere_ids: []
    };
    this.selectedTeacherClasseIds.set([]);
  }

  // --- CUSTOM MULTI-SELECT DROPDOWN LOGIC ---
  toggleClassesDropdown() {
    this.isClassesDropdownOpen.set(!this.isClassesDropdownOpen());
    if (this.isClassesDropdownOpen()) this.isMatieresDropdownOpen.set(false);
  }

  toggleMatieresDropdown() {
    this.isMatieresDropdownOpen.set(!this.isMatieresDropdownOpen());
    if (this.isMatieresDropdownOpen()) this.isClassesDropdownOpen.set(false);
  }

  onClasseCheckboxChange(id: number, event: any) {
    const isChecked = event.target.checked;
    let currentIds = [...this.formTeacher.classe_ids];
    
    if (isChecked) {
      if (!currentIds.includes(id.toString())) currentIds.push(id.toString());
    } else {
      currentIds = currentIds.filter(cId => cId !== id.toString());
    }
    
    this.formTeacher.classe_ids = currentIds;
    this.selectedTeacherClasseIds.set(currentIds);
    this.onClasseChange(null);
  }

  onMatiereCheckboxChange(id: number, event: any) {
    const isChecked = event.target.checked;
    let currentIds = [...this.formTeacher.matiere_ids];
    
    if (isChecked) {
      if (!currentIds.includes(id.toString())) currentIds.push(id.toString());
    } else {
      currentIds = currentIds.filter(mId => mId !== id.toString());
    }
    
    this.formTeacher.matiere_ids = currentIds;
  }

  getSelectedClassesText(): string {
     if (!this.formTeacher.classe_ids || this.formTeacher.classe_ids.length === 0) return "-- Choisir une ou plusieurs classes --";
     const selected = this.classes().filter(c => this.formTeacher.classe_ids.includes(c.id.toString()));
     return selected.map(c => `${c.nom_classe} (${c.niveau})`).join(', ');
  }

  getSelectedMatieresText(): string {
     if (!this.formTeacher.matiere_ids || this.formTeacher.matiere_ids.length === 0) return "-- Choisir une ou plusieurs matières --";
     const selected = this.matieres().filter(m => this.formTeacher.matiere_ids.includes(m.id.toString()));
     return selected.map(m => `${m.nom_matiere} (${m.filiere} ${m.niveau})`).join(', ');
  }

  getTeacherUniqueClasses(teacher: any): any[] {
    if (!teacher.affectations) return [];
    const classesMap = new Map();
    teacher.affectations.forEach((a: any) => {
      if (a.classe && !classesMap.has(a.classe.id)) {
        classesMap.set(a.classe.id, a.classe);
      }
    });
    return Array.from(classesMap.values());
  }

  getTeacherUniqueMatieres(teacher: any): any[] {
    if (!teacher.affectations) return [];
    const matieresMap = new Map();
    teacher.affectations.forEach((a: any) => {
      if (a.matiere && !matieresMap.has(a.matiere.id)) {
        matieresMap.set(a.matiere.id, a.matiere);
      }
    });
    return Array.from(matieresMap.values());
  }

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-multi-select')) {
      this.isClassesDropdownOpen.set(false);
      this.isMatieresDropdownOpen.set(false);
    }
  }

  // --- BULLETINS ---
  generateBulletin(studentId: number) {
    this.http.get<any>(`${this.baseUrl}/users/${studentId}/bulletin`).subscribe({
      next: (res) => {
        if (!res.has_grades) {
          const mockGrades = [14.50, 12.00, 16.25, 10.50, 15.00, 13.75, 11.50];
          res.notes = res.notes.map((n: any, idx: number) => {
            return {
              ...n,
              valeur_note: mockGrades[idx % mockGrades.length],
              type_evaluation: 'Examen',
              prof_name: n.prof_name !== 'Non assigné' && n.prof_name ? n.prof_name : 'Professeur Indéterminé'
            };
          });
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