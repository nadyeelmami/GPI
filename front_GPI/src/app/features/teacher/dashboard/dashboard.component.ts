import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  // State signals
  teacherUser = signal<any>(null);
  affectations = signal<any[]>([]);
  affectation = signal<any>(null);
  studentsGrades = signal<any[]>([]);
  message = signal<string | null>(null);
  isLoading = signal<boolean>(true);
  isSidebarOpen = signal<boolean>(true);
  isPasswordModalOpen = signal<boolean>(false);
  newPassword = signal<string>('');

  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const cachedUser = localStorage.getItem('user');
    if (!cachedUser) {
      this.router.navigate(['/login']);
      return;
    }

    const parsedUser = JSON.parse(cachedUser);
    if (parsedUser.role !== 'enseignant') {
      this.router.navigate(['/login']);
      return;
    }

    this.loadTeacherDetails(parsedUser.id);
  }

  loadTeacherDetails(teacherId: number) {
    this.isLoading.set(true);
    this.http.get<any>(`${this.baseUrl}/users/${teacherId}`).subscribe({
      next: (res) => {
        this.teacherUser.set(res);
        if (res.affectations && res.affectations.length > 0) {
          this.affectations.set(res.affectations);
          this.affectation.set(res.affectations[0]);
          this.loadStudentsGrades(res.affectations[0].classe_id, res.affectations[0].matiere_id);
        } else {
          this.affectations.set([]);
          this.affectation.set(null);
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.showNotification('Erreur lors du chargement de votre profil.');
        this.isLoading.set(false);
      }
    });
  }

  loadStudentsGrades(classeId: number, matiereId: number) {
    this.http.get<any[]>(`${this.baseUrl}/notes?classe_id=${classeId}&matiere_id=${matiereId}`).subscribe({
      next: (res) => {
        this.studentsGrades.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.showNotification('Erreur lors du chargement des étudiants et des notes.');
        this.isLoading.set(false);
      }
    });
  }

  // Check if all notes in the list are already published
  isPublished = computed(() => {
    const list = this.studentsGrades();
    if (list.length === 0) return false;
    return list.every(g => g.statut_validation === 1);
  });

  selectAffectation(aff: any) {
    this.affectation.set(aff);
    this.isLoading.set(true);
    this.loadStudentsGrades(aff.classe_id, aff.matiere_id);
    if (window.innerWidth < 768) {
      this.isSidebarOpen.set(false);
    }
  }

  saveDraft() {
    const aff = this.affectation();
    const teacher = this.teacherUser();
    if (!aff || !teacher) return;

    const flattenedGrades: any[] = [];
    this.studentsGrades().forEach(g => {
      flattenedGrades.push({ student_id: g.student_id, valeur_note: g.note_devoir, type_evaluation: 'Devoir' });
      flattenedGrades.push({ student_id: g.student_id, valeur_note: g.note_examen, type_evaluation: 'Examen' });
    });

    const payload = {
      matiere_id: aff.matiere_id,
      prof_id: teacher.id,
      grades: flattenedGrades
    };

    this.http.post(`${this.baseUrl}/notes`, payload).subscribe({
      next: (res: any) => {
        this.showNotification(res.message || 'Notes sauvegardées comme brouillon.');
        this.loadStudentsGrades(aff.classe_id, aff.matiere_id);
      },
      error: (err) => {
        this.showNotification(err.error?.message || 'Erreur lors de la sauvegarde.');
      }
    });
  }

  publishNotes() {
    const aff = this.affectation();
    const teacher = this.teacherUser();
    if (!aff || !teacher) return;

    // Validate that notes are entered and valid
    const list = this.studentsGrades();
    
    // Check if at least one grade is entered
    const hasAnyGrade = list.some(g => 
      (g.note_devoir !== null && g.note_devoir !== '' && g.note_devoir !== undefined) ||
      (g.note_examen !== null && g.note_examen !== '' && g.note_examen !== undefined)
    );
    
    if (!hasAnyGrade) {
      this.showNotification('Veuillez saisir au moins une note avant de publier.');
      return;
    }

    const invalidGrades = list.filter(g => 
      (g.note_devoir !== null && g.note_devoir !== '' && (parseFloat(g.note_devoir) < 0 || parseFloat(g.note_devoir) > 20)) ||
      (g.note_examen !== null && g.note_examen !== '' && (parseFloat(g.note_examen) < 0 || parseFloat(g.note_examen) > 20))
    );
    
    if (invalidGrades.length > 0) {
      this.showNotification('Toutes les notes saisies doivent être comprises entre 0 et 20.');
      return;
    }

    if (!confirm('Attention : Une fois publiées, les notes ne pourront plus être modifiées par vous et seront transmises à l\'administration. Souhaitez-vous publier ?')) {
      return;
    }

    const flattenedGrades: any[] = [];
    list.forEach(g => {
      flattenedGrades.push({ student_id: g.student_id, valeur_note: g.note_devoir, type_evaluation: 'Devoir' });
      flattenedGrades.push({ student_id: g.student_id, valeur_note: g.note_examen, type_evaluation: 'Examen' });
    });

    const payload = {
      matiere_id: aff.matiere_id,
      prof_id: teacher.id,
      grades: flattenedGrades
    };

    this.http.post(`${this.baseUrl}/notes/publish`, payload).subscribe({
      next: (res: any) => {
        this.showNotification(res.message || 'Notes publiées avec succès !');
        this.loadStudentsGrades(aff.classe_id, aff.matiere_id);
      },
      error: (err) => {
        this.showNotification(err.error?.message || 'Erreur lors de la publication.');
      }
    });
  }

  showNotification(msg: string) {
    this.message.set(msg);
    setTimeout(() => this.message.set(null), 3000);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  toggleSidebar() {
    this.isSidebarOpen.set(!this.isSidebarOpen());
  }

  openPasswordModal() {
    this.newPassword.set('');
    this.isPasswordModalOpen.set(true);
  }

  closePasswordModal() {
    this.isPasswordModalOpen.set(false);
  }

  updatePassword() {
    const teacher = this.teacherUser();
    if (!teacher) return;
    
    if (this.newPassword().length < 4) {
      this.showNotification('Le mot de passe doit contenir au moins 4 caractères.');
      return;
    }

    this.http.put(`${this.baseUrl}/users/${teacher.id}/password`, { password: this.newPassword() }).subscribe({
      next: (res: any) => {
        this.showNotification(res.message || 'Mot de passe mis à jour.');
        this.closePasswordModal();
      },
      error: (err) => {
        this.showNotification(err.error?.message || 'Erreur lors de la mise à jour.');
      }
    });
  }
}