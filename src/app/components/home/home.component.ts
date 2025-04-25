import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  isAuthenticated = false;
  userRole: string | null = null;
  userId: number | null = null;
  private authSubscription: Subscription | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Get initial state
    this.updateUserState();
    
    // Subscribe to auth changes
    this.authSubscription = this.authService.isAuthenticated.subscribe(() => {
      this.updateUserState();
    });
  }
  
  ngOnDestroy(): void {
    // Clean up subscription
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
  
  // Listen for storage events (for cross-tab synchronization)
  @HostListener('window:storage', ['$event'])
  onStorageChange(event: StorageEvent): void {
    if (event.key === 'token' || event.key === 'user') {
      // Update state when localStorage changes in another tab
      this.updateUserState();
    }
  }
  
  private updateUserState(): void {
    const isAuth = !!this.authService.getToken();
    this.isAuthenticated = isAuth;
    
    if (isAuth) {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.userRole = user.role;
        this.userId = user.id;
      } else {
        this.userRole = null;
        this.userId = null;
      }
    } else {
      this.userRole = null;
      this.userId = null;
    }
  }
} 