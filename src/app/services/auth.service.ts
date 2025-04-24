import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
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

  constructor(private http: HttpClient) {
    if (this.isBrowser) {
      this.loadUserFromLocalStorage();
    }
  }

  private loadUserFromLocalStorage() {
    if (!this.isBrowser) return;
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      try {
        const userObj = JSON.parse(user);
        this.currentUserSubject.next(userObj);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        this.logout();
      }
    }
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/register`, userData);
  }

  verifyOtp(data: { contact_number: string, otp: string, type: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/verify-otp`, data);
  }

  login(credentials: { contact_number: string, password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.token && response.user && this.isBrowser) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  logout(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_URL}/auth/logout`, {}).pipe(
      tap(() => {
        if (this.isBrowser) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
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
    if (!this.isBrowser) return null;
    return localStorage.getItem('token');
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
        const user = this.getCurrentUser();
        if (user) {
          if (user.role === 'owner') {
            router.navigate(['/owner', user.id, 'dashboard']);
          } else {
            router.navigate(['/dashboard']);
          }
        }
      }
    }
  }
} 