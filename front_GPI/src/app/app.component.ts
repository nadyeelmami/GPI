import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `<h1>Statut de la liaison : {{ statut }}</h1>`,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  statut: string = 'En attente...';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Appel vers la route API de Laravel
    this.http.get('http://127.0.0.1:8000/api/ping').subscribe({
      next: (data: any) => {
        this.statut = data.message; // Affichera "Liaison OK !"
        console.log('Réponse reçue :', data);
      },
      error: (err) => {
        this.statut = 'Erreur de connexion';
        console.error('Erreur de connexion à Laravel:', err);
      }
    });
  }
}