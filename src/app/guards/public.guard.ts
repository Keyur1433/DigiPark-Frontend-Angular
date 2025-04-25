import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const publicGuardFn: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.isAuthenticated.pipe(
    map(isAuthenticated => {
      if (isAuthenticated) {
        // If user is already authenticated, redirect to home page
        const user = authService.getCurrentUser();
        if (user) {
          if (user.role === 'owner') {
            router.navigate(['/owner', user.id, 'dashboard']);
          } else {
            router.navigate(['/']);
          }
        } else {
          router.navigate(['/']);
        }
        return false;
      }
      // If not authenticated, allow access to public routes
      return true;
    })
  );
}; 