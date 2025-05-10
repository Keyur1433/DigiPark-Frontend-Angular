import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { NgbModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-user-details',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbModule, NgbNavModule],
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.css']
})
export class UserDetailsComponent implements OnInit {
  userId!: number;
  user: any = null;
  isLoading = true;
  error = '';
  activeTab = 1;
  
  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get user ID from route params
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('userId');
      if (idParam) {
        this.userId = +idParam;
        this.loadUserDetails();
      } else {
        this.error = 'User ID not provided';
        this.isLoading = false;
      }
    });
  }

  loadUserDetails(): void {
    this.isLoading = true;
    this.error = '';
    
    this.adminService.getUserDetails(this.userId).subscribe({
      next: (response) => {
        this.user = response.user;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load user details. Please try again.';
        this.isLoading = false;
        console.error('Error loading user details:', err);
      }
    });
  }

  refreshData(): void {
    this.loadUserDetails();
  }

  toggleUserStatus(): void {
    this.adminService.toggleUserStatus(this.userId).subscribe({
      next: (response) => {
        // Refresh user data to show updated status
        this.loadUserDetails();
      },
      error: (err) => {
        console.error('Error toggling user status:', err);
        alert('Failed to update user status. Please try again.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin':
        return 'bg-danger';
      case 'owner':
        return 'bg-success';
      case 'user':
        return 'bg-primary';
      default:
        return 'bg-secondary';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }
} 