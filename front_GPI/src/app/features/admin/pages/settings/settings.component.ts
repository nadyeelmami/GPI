import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  settings = [
    { name: 'Nom de la plateforme', value: "GPI - L'ISCAE", type: 'text' },
    { name: 'Inscription ouverte', value: true, type: 'boolean' },
    { name: 'Année académique', value: '2025-2026', type: 'text' }
  ];

  saveSettings() {
    alert('Paramètres enregistrés (simulation)');
  }
}
