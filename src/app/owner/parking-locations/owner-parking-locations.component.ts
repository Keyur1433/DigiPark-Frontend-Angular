import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OwnerService, ParkingLocation } from '../../services/owner.service';

@Component({
  selector: 'app-owner-parking-locations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-4">
      <div class="card">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h2 class="mb-0">My Parking Locations</h2>
          <a [routerLink]="['/owner', userId, 'parking-locations', 'add']" class="btn btn-light">
            <i class="bi bi-plus-circle"></i> Add New
          </a>
        </div>
        <div class="card-body">
          <div *ngIf="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading parking locations...</p>
          </div>
          
          <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
          
          <div *ngIf="!isLoading && !errorMessage">
            <div *ngIf="parkingLocations.length === 0" class="text-center py-5">
              <p class="mb-3">You don't have any parking locations yet.</p>
              <a [routerLink]="['/owner', userId, 'parking-locations', 'add']" class="btn btn-primary">
                Add Your First Parking Location
              </a>
            </div>
            
            <div *ngIf="parkingLocations.length > 0" class="table-responsive">
              <table class="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Capacity (2W/4W)</th>
                    <th>Rates (₹/hr)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let location of parkingLocations">
                    <td>{{ location.name }}</td>
                    <td>{{ location.address }}, {{ location.city }}</td>
                    <td>{{ location.two_wheeler_capacity }}/{{ location.four_wheeler_capacity }}</td>
                    <td>{{ location.two_wheeler_price_per_hour }}/{{ location.four_wheeler_price_per_hour }}</td>
                    <td>
                      <span class="badge" [ngClass]="location.is_active ? 'bg-success' : 'bg-danger'">
                        {{ location.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <div class="d-flex gap-2">
                        <!-- Edit functionality temporarily disabled until route is fully implemented -->
                        <button class="btn btn-sm btn-outline-primary" disabled>
                          Edit
                        </button>
                        <button (click)="toggleLocationStatus(location)" 
                                class="btn btn-sm" 
                                [ngClass]="location.is_active ? 'btn-outline-danger' : 'btn-outline-success'">
                          {{ location.is_active ? 'Deactivate' : 'Activate' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="mt-3">
            <a [routerLink]="['/owner', userId, 'dashboard']" class="btn btn-secondary">Back to Dashboard</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .badge {
      font-size: 0.9em;
      padding: 0.5em 0.75em;
    }
  `]
})
export class OwnerParkingLocationsComponent implements OnInit {
  userId: number | null = null;
  parkingLocations: ParkingLocation[] = [];
  isLoading = true;
  errorMessage = '';
  
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private ownerService: OwnerService
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
      
      // Load parking locations after getting user ID
      this.loadParkingLocations();
    });
  }
  
  loadParkingLocations(): void {
    this.isLoading = true;
    this.ownerService.getParkingLocations().subscribe({
      next: (response) => {
        this.parkingLocations = response.parking_locations;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Failed to load parking locations. Please try again.';
        }
      }
    });
  }
  
  toggleLocationStatus(location: ParkingLocation): void {
    this.ownerService.toggleParkingLocationStatus(location.id).subscribe({
      next: (updatedLocation) => {
        // Find and update the location in the array
        const index = this.parkingLocations.findIndex(loc => loc.id === location.id);
        if (index !== -1) {
          this.parkingLocations[index].is_active = !this.parkingLocations[index].is_active;
        }
      },
      error: (error) => {
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Failed to update location status. Please try again.';
        }
      }
    });
  }
} 