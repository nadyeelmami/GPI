import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userStr = localStorage.getItem('user');

  if (!userStr) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const user = JSON.parse(userStr);
    const expectedRoles = route.data?.['roles'] as Array<string>;

    if (expectedRoles && expectedRoles.length > 0 && !expectedRoles.includes(user.role)) {
      // Redirect to correct dashboard based on role
      if (user.role === 'admin') {
        router.navigate(['/admin']);
      } else if (user.role === 'enseignant') {
        router.navigate(['/teacher']);
      } else if (user.role === 'etudiant') {
        router.navigate(['/student/dashboard']);
      } else {
        router.navigate(['/login']);
      }
      return false;
    }
    return true;
  } catch (e) {
    localStorage.removeItem('user');
    router.navigate(['/login']);
    return false;
  }
};

export const redirectLoggedInGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userStr = localStorage.getItem('user');

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role === 'admin') {
        router.navigate(['/admin']);
      } else if (user.role === 'enseignant') {
        router.navigate(['/teacher']);
      } else if (user.role === 'etudiant') {
        router.navigate(['/student/dashboard']);
      }
      return false;
    } catch (e) {
      localStorage.removeItem('user');
      return true;
    }
  }
  return true;
};
