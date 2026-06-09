import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth/auth.service';
import { SidebarComponent } from '../../../shared/sidebar/sidebar.component';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, FormsModule, SidebarComponent],
  templateUrl: './student-layout.component.html',
  styleUrls: ['./student-layout.component.css']
})
export class StudentLayoutComponent implements OnInit {

  isSidebarOpen: boolean = true;
  currentUser: any = null;

  @HostListener('window:toggle-sidebar', [])
  onToggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  // Change Password Modal State
  showChangePasswordModal: boolean = false;
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  passwordSuccess = '';
  isPasswordSubmitting = false;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }

    // Sync with backend to get latest user info (e.g. name, email, matricule)
    this.authService.getUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        localStorage.setItem('user', JSON.stringify(user));
      },
      error: (err) => {
        console.error('Error syncing user data on layout init', err);
        if (err.status === 401) {
          this.onLogout();
        }
      }
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
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

  openChangePasswordModal(): void {
    this.showChangePasswordModal = true;
    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.passwordError = '';
    this.passwordSuccess = '';
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal = false;
  }

  submitChangePassword(): void {
    if (!this.oldPassword || !this.newPassword || !this.confirmPassword) {
      this.passwordError = 'Veuillez remplir tous les champs.';
      return;
    }

    if (this.newPassword.length < 6) {
      this.passwordError = 'Le nouveau mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Les nouveaux mots de passe ne correspondent pas.';
      return;
    }

    this.passwordError = '';
    this.passwordSuccess = '';
    this.isPasswordSubmitting = true;

    this.authService.changePassword({
      old_password: this.oldPassword,
      new_password: this.newPassword
    }).subscribe({
      next: (res) => {
        this.isPasswordSubmitting = false;
        this.passwordSuccess = 'Votre mot de passe a été modifié avec succès.';
        this.oldPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        setTimeout(() => {
          this.closeChangePasswordModal();
        }, 2000);
      },
      error: (err) => {
        this.isPasswordSubmitting = false;
        if (err.status === 401) {
          this.passwordError = 'Votre session a expiré. Veuillez vous reconnecter.';
          setTimeout(() => {
            this.onLogout();
          }, 2500);
        } else {
          this.passwordError = err.error?.message || 'Erreur lors de la modification. Vérifiez votre ancien mot de passe.';
        }
      }
    });
  }

  onLogout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}