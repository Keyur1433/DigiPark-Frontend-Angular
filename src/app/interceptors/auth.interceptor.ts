import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

/**
 * Auth interceptor that adds the Bearer token to all API requests
 * and handles 401 Unauthorized responses
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Check if running in browser
  const platformId = inject(PLATFORM_ID);
  const isBrowser = isPlatformBrowser(platformId);
  const router = inject(Router);
  
  // Avoid adding auth headers to non-API requests
  const isApiRequest = req.url.includes('/api/');
  
  // Skip if not API request or not in browser
  if (!isApiRequest || !isBrowser) {
    return next(req);
  }

  // Get token from localStorage with try/catch for safety
  let token = null;
  try {
    token = localStorage.getItem('token');
    console.log(`Auth interceptor: ${req.method} ${req.url} - Token ${token ? 'present' : 'missing'}`);
  } catch (e) {
    console.error('Error accessing localStorage in interceptor:', e);
  }
  
  if (token) {
    // Clone the request and add the authorization header
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      }
    });

    // Send the cloned request with the authorization header
    return next(authReq).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          // If we get 401 Unauthorized, the token is invalid/expired
          if (error.status === 401) {
            console.log('Received 401 Unauthorized, redirecting to login');
            // Clear token from localStorage
            try {
              localStorage.removeItem('token');
              localStorage.removeItem('user_minimal');
            } catch (e) {
              console.error('Error clearing localStorage:', e);
            }
            
            // Redirect to login page
            router.navigate(['/auth/login']);
          }
        }
        return throwError(() => error);
      })
    );
  }

  // No token, proceed with the original request
  return next(req);
}; 