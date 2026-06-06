import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

interface IDashboardNotification {
  id: string;
  type: string;
  message: string;
  time: string;
  icon: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.css']
})
export class StudentDashboardComponent implements OnInit {
  
  showNotifications = false;
  showProfileDropdown = false;

  currentUser: any = null;
  studentName = 'Esma Dah';

  notifications: IDashboardNotification[] = [
    { id: 'n1', type: 'bulletin', message: 'Votre bulletin officiel du Semestre 1 est disponible.', time: 'Il y a 10 min', icon: 'fa-file-invoice' },
    { id: 'n2', type: 'note', message: 'Nouvelle note publiée en Développement Web (Angular).', time: 'Il y a 2 heures', icon: 'fa-graduation-cap' },
    { id: 'n3', type: 'moyenne', message: 'Calcul automatique : votre moyenne générale a été actualisée.', time: 'Hier', icon: 'fa-chart-line' }
  ];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
        if (this.currentUser && this.currentUser.name) {
          this.studentName = this.currentUser.name;
        }
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
    
    // Sync with backend to get latest user info
    this.authService.getUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        if (user && user.name) {
          this.studentName = user.name;
        }
        localStorage.setItem('user', JSON.stringify(user));
      },
      error: (err) => {
        console.error('Error syncing user details in dashboard init', err);
      }
    });
  }

  getUserInitials(): string {
    if (!this.studentName) return 'ED';
    const name = this.studentName.trim();
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getStudentFirstName(): string {
    if (!this.currentUser || !this.currentUser.name) return 'Esma';
    const parts = this.currentUser.name.trim().split(/\s+/);
    return parts[0];
  }

  getStudentLastName(): string {
    if (!this.currentUser || !this.currentUser.name) return 'Dah';
    const parts = this.currentUser.name.trim().split(/\s+/);
    return parts.slice(1).join(' ') || 'Dah';
  }

  getStudentMatricule(): string {
    if (!this.currentUser) return 'I12345';
    if (this.currentUser.matricule) return this.currentUser.matricule;
    if (this.currentUser.email) {
      return this.currentUser.email.split('@')[0].toUpperCase();
    }
    return 'I12345';
  }

  onToggleSidebar(): void {
    window.dispatchEvent(new Event('toggle-sidebar'));
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
  }

  toggleProfileDropdown(event: Event): void {
    event.stopPropagation();
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  @HostListener('document:click', [])
  closeDropdown(): void {
    this.showNotifications = false;
    this.showProfileDropdown = false;
  }
}
