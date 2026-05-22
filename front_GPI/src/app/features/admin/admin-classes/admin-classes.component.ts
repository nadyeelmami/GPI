import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-admin-classes',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="p-4 md:p-5">
      <div class="mb-5">
        <h2 class="fw-bold text-dark">Gestion des Classes</h2>
        <p class="text-muted">Ajoutez et gérez les niveaux d'études de l'ISCAE.</p>
      </div>

      <div class="row g-4">
        <!-- Formulaire -->
        <div class="col-md-4">
          <div class="card border-0 shadow-sm rounded-4 p-4">
            <h5 class="fw-bold text-primary mb-4">Nouvelle Classe</h5>
            
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted uppercase">Nom de la classe</label>
              <input type="text" [(ngModel)]="form.nom_classe" class="form-control bg-light border-0 py-2" placeholder="Ex: L1 Informatique">
            </div>

            <div class="mb-3">
              <label class="form-label small fw-bold text-muted uppercase">Niveau</label>
              <select [(ngModel)]="form.niveau" class="form-select bg-light border-0">
                <option value="L1">Licence 1</option>
                <option value="L2">Licence 2</option>
                <option value="L3">Licence 3</option>
                <option value="M1">Master 1</option>
                <option value="M2">Master 2</option>
              </select>
            </div>

            <button (click)="saveClasse()" class="btn btn-primary w-100 fw-bold py-2 mt-3 rounded-3 shadow-sm">
              Enregistrer la classe
            </button>
          </div>
        </div>

        <!-- Liste -->
        <div class="col-md-8">
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-light">
                  <tr>
                    <th class="p-4">DÉSIGNATION</th>
                    <th>NIVEAU</th>
                    <th class="text-end p-4">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let c of classes()">
                    <td class="p-4 fw-bold text-dark">{{ c.nom_classe }}</td>
                    <td><span class="badge bg-primary-subtle text-primary rounded-pill px-3">{{ c.niveau }}</span></td>
                    <td class="text-end p-4">
                      <button (click)="deleteClasse(c.id)" class="btn btn-sm btn-light text-danger border-0">Supprimer</button>
                    </td>
                  </tr>
                  <tr *ngIf="classes().length === 0">
                    <td colspan="3" class="text-center py-5 text-muted small">Aucune classe enregistrée.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-primary-subtle { background-color: #e7f1ff; }
    .form-control:focus { box-shadow: none; border: 1px solid #0d6efd; background: #fff !important; }
  `]
})
export class AdminClassesComponent implements OnInit {
  classes = signal<any[]>([]);
  form = { nom_classe: '', niveau: 'L1', annee_scolaire: '2025-2026' };
  private apiUrl = 'http://localhost:8000/api/classes';

  constructor(private http: HttpClient) {}

  ngOnInit() { this.fetch(); }

  fetch() {
    this.http.get<any[]>(this.apiUrl).subscribe(res => this.classes.set(res));
  }

  saveClasse() {
    if(!this.form.nom_classe) return;
    this.http.post(this.apiUrl, this.form).subscribe(() => {
      this.fetch();
      this.form.nom_classe = '';
    });
  }

  deleteClasse(id: number) {
    if(confirm('Supprimer cette classe ?')) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => this.fetch());
    }
  }
}