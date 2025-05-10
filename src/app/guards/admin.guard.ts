import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const adminGuardFn: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const userRole = authService.getUserRole();
  const userId = authService.getUserId();
  
  if (userRole === 'admin') {
    return true;
  }
  
  // If user is not an admin, redirect to login
  return router.parseUrl('/login');
}; 