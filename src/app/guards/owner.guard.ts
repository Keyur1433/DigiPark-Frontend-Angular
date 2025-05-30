import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const ownerGuardFn: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const userRole = authService.getUserRole();
  const userId = authService.getUserId();
  
  if (userRole === 'owner') {
    return true;
  }
  
  // Redirect to owner dashboard if not an owner
  if (userId) {
    return router.parseUrl(`/owner/${userId}/dashboard`);
  }
  
  // If no user ID, redirect to login
  return router.parseUrl('/login');
}; 