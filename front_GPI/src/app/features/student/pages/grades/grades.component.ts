import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grades.component.html',
  styleUrl: './grades.component.css'
})
export class GradesComponent {
  grades = [
    { id: 1, course: 'Développement Web Avancé', type: 'Contrôle Continu 1', score: 16.5, maxScore: 20, date: '15 Avril 2026' },
    { id: 2, course: 'Bases de Données Relationnelles', type: 'Projet Final', score: 14, maxScore: 20, date: '02 Mai 2026' },
    { id: 3, course: 'Gestion de Projet Agile', type: 'Examen', score: 18, maxScore: 20, date: '28 Mars 2026' }
  ];

  getAverage(): string {
    if (this.grades.length === 0) return '0.00';
    const sum = this.grades.reduce((acc, curr) => acc + (curr.score / curr.maxScore) * 20, 0);
    return (sum / this.grades.length).toFixed(2);
  }
}
