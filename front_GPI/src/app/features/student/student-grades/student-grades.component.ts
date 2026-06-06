import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-student-grades',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-grades.component.html',
  styleUrl: './student-grades.component.css'
})
export class StudentGradesComponent implements OnInit {
  currentUser: any = null;
  bulletin: any = null;
  isLoading = true;
  hasBulletin = false;
  todayStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
        this.fetchBulletin();
      } catch (e) {
        console.error('Error parsing user data in grades init', e);
      }
    }

    // Sync with backend to get latest user info
    this.authService.getUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        localStorage.setItem('user', JSON.stringify(user));
        this.fetchBulletin();
      },
      error: (err) => {
        console.error('Error syncing user details in grades init', err);
        this.isLoading = false;
      }
    });
  }

  fetchBulletin(): void {
    if (!this.currentUser || !this.currentUser.id) {
      this.isLoading = false;
      return;
    }

    const isPublished = this.currentUser.bulletin_publie === 1 || this.currentUser.bulletin_publie === true;
    if (!isPublished) {
      this.hasBulletin = false;
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.authService.getBulletin(this.currentUser.id).subscribe({
      next: (res) => {
        this.bulletin = res;
        this.hasBulletin = true;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching student bulletin', err);
        this.hasBulletin = false;
        this.isLoading = false;
      }
    });
  }

  printBulletin(): void {
    window.print();
  }
}
