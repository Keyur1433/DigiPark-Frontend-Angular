import { HttpInterceptorFn } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Check if running in browser
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  // Get token from localStorage
  const token = localStorage.getItem('token');
  if (token) {
    // Clone the request and add the new header
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });

    // Send the cloned request with the authorization header
    return next(authReq);
  }

  return next(req);
}; 