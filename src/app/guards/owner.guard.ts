import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const ownerGuardFn: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const currentUser = authService.getCurrentUser();
  
  if (currentUser && currentUser.role === 'owner') {
    return true;
  }
  
  // Redirect to dashboard if not an owner
  return router.parseUrl('/dashboard');
}; 