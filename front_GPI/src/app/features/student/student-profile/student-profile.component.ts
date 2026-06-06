import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-profile.component.html',
  styleUrl: './student-profile.component.css'
})
export class StudentProfileComponent implements OnInit {
  currentUser: any = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }

    // Sync with backend to get latest user info
    this.authService.getUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        localStorage.setItem('user', JSON.stringify(user));
      },
      error: (err) => {
        console.error('Error syncing user details in profile init', err);
      }
    });
  }

  getUserInitials(): string {
    if (!this.currentUser || !this.currentUser.name) return 'ED';
    const name = this.currentUser.name.trim();
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
}
