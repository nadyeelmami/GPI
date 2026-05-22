import { Routes } from '@angular/router';

export const routes: Routes = [
{ path: '', redirectTo: '/login', pathMatch: 'full' },
{
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
},
{
    path: 'admin',
    loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
},
{
    path: 'admin/classes',
    loadComponent: () => import('./features/admin/admin-classes/admin-classes.component').then(m => m.AdminClassesComponent)
},
{
    path: 'teacher',
    loadComponent: () => import('./features/teacher/dashboard/dashboard.component').then(m => m.DashboardComponent)
},
{
    path: 'student',
    loadComponent: () => import('./features/student/dashboard/dashboard.component').then(m => m.DashboardComponent)
},
{ path: '**', redirectTo: '/login' }
];



