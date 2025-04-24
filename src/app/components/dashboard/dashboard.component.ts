import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NgbDropdownModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService, UserProfile } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

interface BookingSummary {
  active: number;
  completed: number;
  cancelled: number;
  upcoming: number;
}

interface Vehicle {
  id: number;
  type: string;
  number_plate: string;
  brand: string;
  model: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbNavModule, NgbDropdownModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: UserProfile | null = null;
  activeTab = 1;
  bookings: BookingSummary = { active: 0, completed: 0, cancelled: 0, upcoming: 0 };
  recentBookings: any[] = [];
  vehicles: Vehicle[] = [];
  isLoading = true;
  currentDate = new Date();
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    // Load initial dashboard data
    this.fetchDashboardData();
  }

  fetchDashboardData() {
    this.isLoading = true;
    
    // In a real application, we would fetch this data from the backend
    // For now, we'll simulate fetching with a timeout
    setTimeout(() => {
      // Simulate data for bookings summary
      this.bookings = {
        active: 2,
        completed: 5,
        cancelled: 1,
        upcoming: 3
      };
      
      // Simulate recent bookings
      this.recentBookings = [
        {
          id: 1,
          location: 'Central Parking Lot',
          entry_time: new Date(new Date().setHours(new Date().getHours() - 3)),
          exit_time: null,
          status: 'active',
          vehicle: 'GJ01AB1234 (Honda City)',
          amount: 120
        },
        {
          id: 2,
          location: 'Mall Parking',
          entry_time: new Date(new Date().setDate(new Date().getDate() - 1)),
          exit_time: new Date(new Date().setDate(new Date().getDate() - 1)),
          status: 'completed',
          vehicle: 'GJ01XY5678 (Hyundai i20)',
          amount: 80
        },
        {
          id: 3,
          location: 'Airport Parking',
          entry_time: new Date(new Date().setDate(new Date().getDate() + 2)),
          exit_time: null,
          status: 'upcoming',
          vehicle: 'GJ01CD9876 (Toyota Fortuner)',
          amount: 200
        }
      ];
      
      // Simulate vehicles
      this.vehicles = [
        {
          id: 1,
          type: 'Car',
          number_plate: 'GJ01AB1234',
          brand: 'Honda',
          model: 'City',
          color: 'Silver'
        },
        {
          id: 2,
          type: 'Car',
          number_plate: 'GJ01XY5678',
          brand: 'Hyundai',
          model: 'i20',
          color: 'White'
        },
        {
          id: 3,
          type: 'SUV',
          number_plate: 'GJ01CD9876',
          brand: 'Toyota',
          model: 'Fortuner',
          color: 'Black'
        }
      ];
      
      this.isLoading = false;
    }, 1000);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-primary';
      case 'completed': return 'bg-success';
      case 'cancelled': return 'bg-danger';
      case 'upcoming': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  formatDate(date: Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout failed', error);
      }
    });
  }
  
  // Multi-strategy navigation method
  navigateToParkingLocations(): void {
    console.log('Attempting to navigate to parking locations with multi-strategy approach');
    
    // Strategy 1: Try Angular Router with navigateByUrl (more direct than navigate)
    this.router.navigateByUrl('/parking-locations').then(success => {
      console.log('Router.navigateByUrl result:', success);
      
      if (!success) {
        // Strategy 2: If router navigation fails, try traditional location change
        console.log('Falling back to window.location approach');
        const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
        const targetUrl = baseHref + 'parking-locations';
        
        // Use assign for a complete page reload which can solve hydration/SSR issues
        window.location.assign(targetUrl);
      }
    }).catch(err => {
      console.error('Navigation error:', err);
      // Strategy 3: Last resort - direct location change
      window.location.href = '/parking-locations';
    });
  }
} 