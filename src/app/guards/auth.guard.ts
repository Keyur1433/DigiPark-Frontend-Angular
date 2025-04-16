import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.authService.isAuthenticated.pipe(
      map(isAuthenticated => {
        if (isAuthenticated) {
          return true;
        }
        
        // Redirect to login if not authenticated
        return this.router.createUrlTree(['/login']);
      })
    );
  }
}

// Angular 16+ functional route guard
export const authGuardFn: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  if (!isPlatformBrowser(platformId)) {
    // During server-side rendering, allow access 
    // and let the client-side guard handle authentication
    return true;
  }
  
  const token = localStorage.getItem('token');
  
  if (token) {
    return true;
  }
  
  return router.createUrlTree(['/login']);
}; 