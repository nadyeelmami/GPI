import { Routes } from '@angular/router';
import { authGuard, redirectLoggedInGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { 
    path: 'login', 
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [redirectLoggedInGuard]
  },
  { 
    path: 'admin', 
    loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: { roles: ['admin'] }
  },
  { 
    path: 'admin/classes', 
    loadComponent: () => import('./features/admin/admin-classes/admin-classes.component').then(m => m.AdminClassesComponent),
    canActivate: [authGuard],
    data: { roles: ['admin'] }
  },
  { 
    path: 'teacher', 
    loadComponent: () => import('./features/teacher/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    data: { roles: ['enseignant'] }
  },
  
  // ESPACE ÉTUDIANT (Votre version préservée)
  { 
    path: 'student', 
    loadComponent: () => import('./features/student/student-layout/student-layout.component').then(m => m.StudentLayoutComponent),
    canActivate: [authGuard],
    data: { roles: ['etudiant'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { 
        path: 'dashboard', 
        loadComponent: () => import('./features/student/student-dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent) 
      },
      { 
        path: 'grades', 
        loadComponent: () => import('./features/student/student-grades/student-grades.component').then(m => m.StudentGradesComponent) 
      },
      { 
        path: 'profile', 
        loadComponent: () => import('./features/student/student-profile/student-profile.component').then(m => m.StudentProfileComponent) 
      }
    ]
  },

  { path: '**', redirectTo: '/login' }
];