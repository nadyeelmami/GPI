import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  studentUser = signal<any>(null);
  bulletinData = signal<any>(null);
  isLoading = signal<boolean>(true);
  message = signal<string | null>(null);
  todayStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  private baseUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const cachedUser = localStorage.getItem('user');
    if (!cachedUser) {
      this.router.navigate(['/login']);
      return;
    }

    const parsedUser = JSON.parse(cachedUser);
    if (parsedUser.role !== 'etudiant') {
      this.router.navigate(['/login']);
      return;
    }

    this.loadStudentProfile(parsedUser.id);
  }

  loadStudentProfile(studentId: number) {
    this.isLoading.set(true);
    // Fetch profile to verify if bulletin is published
    this.http.get<any>(`${this.baseUrl}/users/${studentId}`).subscribe({
      next: (res) => {
        this.studentUser.set(res);
        
        const isPublished = res.bulletin_publie === 1 || res.bulletin_publie === true;
        if (isPublished) {
          this.loadBulletin(studentId);
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.showNotification('Erreur lors du chargement de votre profil.');
        this.isLoading.set(false);
      }
    });
  }

  loadBulletin(studentId: number) {
    this.http.get<any>(`${this.baseUrl}/users/${studentId}/bulletin`).subscribe({
      next: (res) => {
        // Calculate average and mention
        let totalPoints = 0;
        let totalCoefficients = 0;
        
        if (res.notes && res.notes.length > 0) {
          res.notes.forEach((n: any) => {
            if (n.valeur_note !== null && n.valeur_note !== undefined && n.valeur_note !== '') {
              totalPoints += parseFloat(n.valeur_note) * n.coefficient;
              totalCoefficients += n.coefficient;
            }
          });
          res.moyenneG = totalCoefficients > 0 ? (totalPoints / totalCoefficients) : 0;
        } else {
          res.moyenneG = 0;
        }

        // Mention
        if (res.moyenneG >= 16) res.mention = 'Très Bien';
        else if (res.moyenneG >= 14) res.mention = 'Bien';
        else if (res.moyenneG >= 12) res.mention = 'Assez Bien';
        else if (res.moyenneG >= 10) res.mention = 'Passable';
        else res.mention = 'Ajourné';

        this.bulletinData.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.showNotification('Impossible de charger le bulletin de notes.');
        this.isLoading.set(false);
      }
    });
  }

  isBulletinPublished = computed(() => {
    const user = this.studentUser();
    if (!user) return false;
    return user.bulletin_publie === 1 || user.bulletin_publie === true;
  });

  printBulletin() {
    window.print();
  }

  showNotification(msg: string) {
    this.message.set(msg);
    setTimeout(() => this.message.set(null), 3000);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
