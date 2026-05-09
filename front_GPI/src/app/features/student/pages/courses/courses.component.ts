import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.css'
})
export class CoursesComponent {
  courses = [
    { id: 1, name: 'Développement Web Avancé', teacher: 'M. Dubois', status: 'En cours', progress: 75 },
    { id: 2, name: 'Bases de Données Relationnelles', teacher: 'Mme. Martin', status: 'En cours', progress: 40 },
    { id: 3, name: 'Gestion de Projet Agile', teacher: 'M. Bernard', status: 'Terminé', progress: 100 },
    { id: 4, name: 'Intelligence Artificielle', teacher: 'Mme. Leroy', status: 'Nouveau', progress: 0 }
  ];
}
