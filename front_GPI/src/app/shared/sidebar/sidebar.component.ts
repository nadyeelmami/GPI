import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Input() role: 'teacher' | 'admin' | 'student' = 'student';
  @Input() isSidebarOpen: boolean = true;
  @Input() teacherUser: any = null;
  @Input() affectations: any[] = [];
  @Input() selectedAffectation: any = null;
  @Input() activeAdminTab: 'classes' | 'students' | 'teachers' | 'bulletins' = 'classes';
  @Input() currentUser: any = null;
  @Input() profileName: string = '';
  @Input() profileRole: string = '';
  @Input() avatarText: string = '';
  @Input() showPasswordAction: boolean = true;

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() selectAffectation = new EventEmitter<any>();
  @Output() selectAdminTab = new EventEmitter<'classes' | 'students' | 'teachers' | 'bulletins'>();
  @Output() logout = new EventEmitter<void>();
  @Output() openPasswordModal = new EventEmitter<void>();

  adminMenuItems = [
    { key: 'classes' as const, icon: 'fa-solid fa-graduation-cap', label: 'Classes' },
    { key: 'students' as const, icon: 'fa-solid fa-user-graduate', label: 'Étudiants' },
    { key: 'teachers' as const, icon: 'fa-solid fa-chalkboard-user', label: 'Enseignants' },
    { key: 'bulletins' as const, icon: 'fa-solid fa-file-invoice', label: 'Bulletins' }
  ];

  studentMenuItems = [
    { path: '/student/dashboard', icon: 'fa-solid fa-chart-pie', label: 'Tableau de bord' },
    { path: '/student/grades', icon: 'fa-solid fa-graduation-cap', label: 'Mes Notes & Moyennes' },
    { path: '/student/profile', icon: 'fa-solid fa-user', label: 'Mon Profil' }
  ];

  get displayProfileName(): string {
    return this.profileName || this.currentUser?.name || 'Utilisateur';
  }

  get displayProfileRole(): string {
    if (this.profileRole) return this.profileRole;
    const role = this.currentUser?.role;
    if (!role) return 'Utilisateur';
    if (role === 'enseignant') return 'Enseignant';
    if (role === 'etudiant') return 'Étudiant';
    if (role === 'admin' || role === 'administrateur') return 'Administrateur';
    return this.capitalize(role);
  }

  get displayAvatarText(): string {
    if (this.avatarText) return this.avatarText;
    const name = this.currentUser?.name || this.displayProfileName;
    return this.getInitials(name);
  }

  private capitalize(value: string): string {
    return (value && value.length > 0) ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  }

  private getInitials(name: string): string {
    if (!name) return 'US';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
