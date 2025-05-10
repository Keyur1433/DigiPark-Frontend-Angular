import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, CanActivateFn, Router, UrlTree, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
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
export const authGuardFn: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  
  console.log('Auth Guard activated for route:', state.url);
  
  if (!isPlatformBrowser(platformId)) {
    // During server-side rendering, allow access 
    // and let the client-side guard handle authentication
    console.log('Server-side rendering - allowing access');
    return true;
  }
  
  // Check if user is authenticated through the service
  return authService.isAuthenticated.pipe(
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }
      
      // Store the attempted URL for redirecting after login
      sessionStorage.setItem('redirectAfterLogin', state.url);
      
      console.log('Authentication failed, redirecting to login');
      return router.createUrlTree(['/login']);
    })
  );
}; 