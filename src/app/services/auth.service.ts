import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of, map, catchError, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

const API_URL = 'http://127.0.0.1:8000/api';

export interface UserProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  state: string;
  city: string;
  country: string;
  role: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  message: string;
  user?: UserProfile;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated = this.isAuthenticatedSubject.asObservable();
  
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  
  // Add an in-memory token for SSR environments
  private inMemoryToken: string | null = null;
  // Add last token check time
  private lastTokenCheck: number = 0;

  constructor(private http: HttpClient) {
    console.log('AuthService initializing, isBrowser =', this.isBrowser);
    // Always try to load user, not just in browser environments
    this.loadUserFromStorage();
  }

  private loadUserFromStorage() {
    console.log('Loading user from storage');
    let token = null;
    
    if (this.isBrowser) {
      // Use try-catch for localStorage as it can throw errors in some browsers
      try {
        token = localStorage.getItem('token');
        console.log('Token from localStorage:', token ? 'exists' : 'not found');
        
        if (token) {
          this.inMemoryToken = token;
          this.isAuthenticatedSubject.next(true);
          
          // Try to load minimal info directly
          try {
            const minimalInfoStr = localStorage.getItem('user_minimal');
            if (minimalInfoStr) {
              const minimalInfo = JSON.parse(minimalInfoStr);
              if (minimalInfo && minimalInfo.id) {
                console.log('Found minimal user info, id:', minimalInfo.id);
                // We have some user info, simulate a user object
                const partialUser = {
                  id: minimalInfo.id,
                  role: minimalInfo.role || 'user',
                  // Add minimal required fields to avoid null errors
                  first_name: 'User',
                  last_name: '',
                  email: '',
                  contact_number: '',
                  state: '',
                  city: '',
                  country: '',
                  is_verified: true,
                  created_at: '',
                  updated_at: ''
                } as UserProfile;
                
                // Set this as current user until we can fetch real user
                this.currentUserSubject.next(partialUser);
              }
            } else {
              console.log('No minimal user info found in localStorage');
            }
          } catch (e) {
            console.error('Error parsing minimal user info', e);
          }
          
          // Fetch full user profile in the background
          setTimeout(() => {
            this.fetchCurrentUser().subscribe({
              next: user => console.log('User profile fetched in background:', user?.id),
              error: err => console.error('Background user fetch failed:', err)
            });
          }, 100); // Short timeout to ensure HTTP interceptors are ready
        }
      } catch (e) {
        console.error('Error accessing localStorage:', e);
      }
    } else {
      // In SSR, use the in-memory token if available
      token = this.inMemoryToken;
      if (token) {
        console.log('Using in-memory token in SSR');
        this.isAuthenticatedSubject.next(true);
      }
    }
  }

  fetchCurrentUser(): Observable<UserProfile | null> {
    const token = this.getToken();
    
    if (!token) {
      console.log('No token available for fetchCurrentUser');
      return of(null);
    }
    
    console.log('Fetching current user with token');
    return this.http.get<{user: UserProfile}>(`${API_URL}/auth/user`).pipe(
      map(response => {
        console.log('User response received:', response);
        return response.user;
      }),
      tap(user => {
        if (user) {
          console.log('User fetched successfully:', user.id);
          this.currentUserSubject.next(user);
          // Store minimal user info in localStorage for persistence
          this.saveUserMinimalInfo(user);
        } else {
          console.warn('User response did not contain user data');
        }
      }),
      catchError(error => {
        console.error('Error fetching current user:', error);
        // If the token is invalid, clear it
        if (error.status === 401) {
          console.log('Received 401, clearing auth');
          this.clearAuth();
        }
        return of(null);
      })
    );
  }

  // Save minimal user info (ID and role only) to localStorage
  private saveUserMinimalInfo(user: UserProfile): void {
    if (!this.isBrowser) return;
    
    try {
      const minimalInfo = {
        id: user.id,
        role: user.role
      };
      console.log('Saving minimal user info to localStorage:', minimalInfo);
      localStorage.setItem('user_minimal', JSON.stringify(minimalInfo));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  // Get user ID from minimal stored info
  getUserId(): number | null {
    // First check if user is in memory
    const userInMemory = this.currentUserSubject.value;
    if (userInMemory && userInMemory.id) {
      return userInMemory.id;
    }
    
    if (this.isBrowser) {
      // If not, check localStorage minimal info
      try {
        const minimalInfoStr = localStorage.getItem('user_minimal');
        if (minimalInfoStr) {
          const minimalInfo = JSON.parse(minimalInfoStr);
          return minimalInfo.id || null;
        }
      } catch (e) {
        console.error('Error parsing user minimal info', e);
      }
    }
    
    return null;
  }

  // Get user role from minimal stored info
  getUserRole(): string | null {
    // First check if user is in memory
    const userInMemory = this.currentUserSubject.value;
    if (userInMemory && userInMemory.role) {
      return userInMemory.role;
    }
    
    if (this.isBrowser) {
      // If not, check localStorage minimal info
      try {
        const minimalInfoStr = localStorage.getItem('user_minimal');
        if (minimalInfoStr) {
          const minimalInfo = JSON.parse(minimalInfoStr);
          return minimalInfo.role || null;
        }
      } catch (e) {
        console.error('Error parsing user minimal info', e);
      }
    }
    
    return null;
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, userData);
  }

  verifyOtp(data: { contact_number: string, otp: string, type: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/verify-otp`, data);
  }

  login(contact_number: string, password: string): Observable<AuthResponse> {
    console.log('Attempting login for number:', contact_number);
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, { contact_number, password })
      .pipe(
        tap(response => {
          console.log('Login response received:', response);
          if (response.token) {
            // Store token in memory for SSR compatibility
            this.inMemoryToken = response.token;
            
            if (this.isBrowser) {
              try {
                localStorage.setItem('token', response.token);
                console.log('Token stored in localStorage');
              } catch (e) {
                console.error('Failed to store token in localStorage:', e);
              }
            }
            
            this.isAuthenticatedSubject.next(true);
            if (response.user) {
              this.currentUserSubject.next(response.user);
              // Save minimal user info for persistence
              this.saveUserMinimalInfo(response.user);
            }
          }
        }),
        catchError(error => {
          console.error('Login failed:', error);
          throw error;
        })
      );
  }

  clearAuth(): void {
    console.log('Clearing auth state');
    this.inMemoryToken = null;
    if (this.isBrowser) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user_minimal');
        localStorage.removeItem('user'); // Remove if exists from previous versions
        console.log('Cleared auth data from localStorage');
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
    }
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  logout(): Observable<AuthResponse> {
    console.log('Logging out user');
    return this.http.post<AuthResponse>(`${API_URL}/auth/logout`, {}).pipe(
      tap(() => {
        this.clearAuth();
      }),
      catchError(error => {
        console.error('Logout error, clearing auth anyway:', error);
        this.clearAuth();
        return of({ message: 'Logged out' });
      })
    );
  }

  forgotPassword(data: { contact_number: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/forgot-password`, data);
  }

  resetPassword(data: { contact_number: string, otp: string, password: string, password_confirmation: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/reset-password`, data);
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    // Check memory first (works in both browser and SSR)
    if (this.inMemoryToken) {
      return this.inMemoryToken;
    }
    
    // For browser only - try localStorage
    if (this.isBrowser) {
      try {
        return localStorage.getItem('token');
      } catch (e) {
        console.error('Error reading token from localStorage:', e);
        return null;
      }
    }
    
    return null;
  }

  /**
   * Check if user is currently logged in
   */
  isLoggedIn(): boolean {
    if (!this.isBrowser) {
      // In SSR, use the authentication subject value
      return this.isAuthenticatedSubject.value;
    }
    
    // In browser, check for token
    try {
      const token = this.getToken();
      const isTokenValid = !!token;
      
      if (isTokenValid !== this.isAuthenticatedSubject.value) {
        // Update the authenticated state to match token
        this.isAuthenticatedSubject.next(isTokenValid);
      }
      
      return isTokenValid;
    } catch (e) {
      console.error('Error in isLoggedIn:', e);
      return false;
    }
  }

  // Force a refresh of the authentication state
  refreshAuthState(): Observable<boolean> {
    if (!this.getToken()) {
      console.log('No token to refresh auth state');
      this.isAuthenticatedSubject.next(false);
      return of(false);
    }
    
    return this.fetchCurrentUser().pipe(
      map(user => {
        const isAuthenticated = !!user;
        console.log('Auth state refreshed, authenticated =', isAuthenticated);
        this.isAuthenticatedSubject.next(isAuthenticated);
        return isAuthenticated;
      }),
      catchError((error) => {
        console.error('Error refreshing auth state:', error);
        this.isAuthenticatedSubject.next(false);
        return of(false);
      })
    );
  }

  // Handle post-login redirects
  handlePostLoginRedirect(router: any): void {
    if (this.isBrowser) {
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.navigateByUrl(redirectUrl);
      } else {
        // Default redirect based on user role
        const userId = this.getUserId();
        const userRole = this.getUserRole();
        
        if (userId) {
          if (userRole === 'owner') {
            router.navigate(['/owner', userId, 'dashboard']);
          } else if (userRole === 'admin') {
            router.navigate(['/admin', userId, 'dashboard']);
          } else {
            router.navigate(['/user', userId, 'dashboard']);
          }
        } else {
          router.navigate(['/']);
        }
      }
    }
  }

  // This method can be used to fetch the CSRF token
  getCsrfToken(): Observable<any> {
    return this.http.get<{token: string}>(`${API_URL}/csrf-token`, { withCredentials: true })
      .pipe(
        tap(response => {
          console.log('CSRF token fetched:', response);
          localStorage.setItem('csrf_token', response.token);
        }),
        catchError(error => {
          console.error('Error fetching CSRF token:', error);
          return throwError(() => error);
        })
      );
  }

  // Method to check authentication status with the server
  checkAuthStatus(): Observable<any> {
    return this.http.get<any>(`${API_URL}/auth/user`, { withCredentials: true })
      .pipe(
        tap(user => {
          console.log('Auth status checked, user:', user);
          if (user && user.id) {
            this.isAuthenticatedSubject.next(true);
            this.currentUserSubject.next(user);
            localStorage.setItem('user_id', user.id.toString());
            localStorage.setItem('user_role', user.role);
          } else {
            this.isAuthenticatedSubject.next(false);
            this.currentUserSubject.next(null);
          }
        }),
        catchError(error => {
          console.error('Error checking auth status:', error);
          this.isAuthenticatedSubject.next(false);
          this.currentUserSubject.next(null);
          return of(null);
        })
      );
  }
} 