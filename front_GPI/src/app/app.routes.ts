import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { StudentDashboardComponent } from './features/student/pages/student-dashboard/student-dashboard.component';
import { CoursesComponent } from './features/student/pages/courses/courses.component';
import { GradesComponent } from './features/student/pages/grades/grades.component';
import { TeacherDashboardComponent } from './features/teacher/pages/teacher-dashboard/teacher-dashboard.component';
import { AdminDashboardComponent } from './features/admin/pages/admin-dashboard/admin-dashboard.component';
import { UsersComponent } from './features/admin/pages/users/users.component';
import { SettingsComponent } from './features/admin/pages/settings/settings.component';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  
  // Routes publiques (Authentification)
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },

  // Routes protégées
  { 
    path: 'student', 
    component: StudentDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'etudiant' }
  },
  { 
    path: 'student/courses', 
    component: CoursesComponent,
    canActivate: [AuthGuard],
    data: { role: 'etudiant' }
  },
  { 
    path: 'student/grades', 
    component: GradesComponent,
    canActivate: [AuthGuard],
    data: { role: 'etudiant' }
  },
  { 
    path: 'teacher', 
    component: TeacherDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'enseignant' }
  },
  { 
    path: 'admin', 
    component: AdminDashboardComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' }
  },
  { 
    path: 'admin/users', 
    component: UsersComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' }
  },
  { 
    path: 'admin/settings', 
    component: SettingsComponent,
    canActivate: [AuthGuard],
    data: { role: 'admin' }
  },

  // Route par défaut (404)
  { path: '**', redirectTo: '/auth/login' }
];
