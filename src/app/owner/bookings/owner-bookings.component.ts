import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-owner-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-4">
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h2>Bookings Management</h2>
        </div>
        <div class="card-body">
          <p>Bookings management page is under development.</p>
          <a [routerLink]="['/owner', userId, 'dashboard']" class="btn btn-primary">Back to Dashboard</a>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class OwnerBookingsComponent implements OnInit {
  userId: number | null = null;
  
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    // Try to get ID from route params first
    this.route.parent?.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.userId = +idParam;
      } else {
        // Fallback to currentUser
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.id) {
          this.userId = currentUser.id;
        }
      }
    });
  }
} 