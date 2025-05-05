import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-owner-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './owner-sidebar.component.html',
  styleUrls: ['./owner-sidebar.component.css']
})
export class OwnerSidebarComponent implements OnInit {
  userId: number | null = null;
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.userId = currentUser.id;
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout successful, redirecting to home page');
        // Redirect to home page after successful logout
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Error during logout:', error);
        // Even on error, still redirect to home page
        this.router.navigate(['/']);
      }
    });
  }
} 