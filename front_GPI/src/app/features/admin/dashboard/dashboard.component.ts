import { Component, OnInit, signal } from '@angular/core';
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
  // Signaux pour une mise à jour rapide de l'interface
  classes = signal<any[]>([]);
  message = signal<string | null>(null);
  
  // Données du formulaire
  formClasse = { 
    nom_classe: '', 
    niveau: 'L1', 
    annee_scolaire: '2025-2026' 
  };

  private apiUrl = 'http://localhost:8000/api/classes';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (res) => this.classes.set(res),
      error: () => this.showNotification('Erreur de connexion au serveur')
    });
  }

  saveClasse() {
    if (!this.formClasse.nom_classe) return;
    this.http.post(this.apiUrl, this.formClasse).subscribe({
      next: () => {
        this.refreshData();
        this.formClasse.nom_classe = ''; // Vide le champ après succès
        this.showNotification('Classe ajoutée !');
      }
    });
  }

  deleteClasse(id: number) {
    if(confirm('Supprimer cette classe ?')) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => {
        this.refreshData();
        this.showNotification('Classe supprimée.');
      });
    }
  }

  showNotification(msg: string) {
    this.message.set(msg);
    setTimeout(() => this.message.set(null), 3000);
  }
}