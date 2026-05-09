import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../core/services/admin.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  roles = ['etudiant', 'enseignant', 'admin'];
  loading = true;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des utilisateurs', err);
        this.loading = false;
      }
    });
  }

  changeRole(user: any, newRole: string): void {
    if (confirm(`Voulez-vous vraiment changer le rôle de ${user.name} en ${newRole} ?`)) {
      this.adminService.updateUserRole(user.id, newRole).subscribe({
        next: () => {
          user.role = newRole;
          alert('Rôle mis à jour avec succès !');
        },
        error: (err) => {
          console.error('Erreur lors du changement de rôle', err);
          alert('Une erreur est survenue.');
        }
      });
    }
  }
}
