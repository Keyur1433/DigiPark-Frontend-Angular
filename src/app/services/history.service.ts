import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private history: string[] = [];
  
  constructor(
    private router: Router,
    private location: Location,
    private authService: AuthService
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.history.push(event.urlAfterRedirects);
        
        // Only keep the last 10 entries
        if (this.history.length > 10) {
          this.history.shift();
        }
      }
    });
  }
  
  /**
   * Handle back navigation safely, preventing authenticated users from going back to login/register
   */
  back(): void {
    const previousUrl = this.getPreviousUrl();
    
    // Check if user is authenticated and trying to go back to login/register
    if (this.authService.getCurrentUser() && 
        (previousUrl.includes('/login') || previousUrl.includes('/register'))) {
      // Skip login/register and go to home
      this.router.navigate(['/']);
    } else {
      // Regular back navigation
      this.location.back();
    }
  }
  
  getPreviousUrl(): string {
    return this.history.length > 1 ? this.history[this.history.length - 2] : '/';
  }
  
  getHistory(): string[] {
    return [...this.history];
  }
} 