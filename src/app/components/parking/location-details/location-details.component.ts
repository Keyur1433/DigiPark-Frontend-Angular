import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ParkingLocationService } from '../../../services/parking-location.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-location-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-4">
      <div class="card shadow">
        <div *ngIf="isLoading" class="text-center p-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading location details...</p>
        </div>
        
        <div *ngIf="errorMessage" class="alert alert-danger m-3">{{ errorMessage }}</div>
        
        <div *ngIf="location && !isLoading">
          <div class="position-relative">
            <img [src]="location.image_url || 'assets/images/default-parking.jpg'" 
                 class="card-img-top parking-image" 
                 alt="{{ location.name }}">
            <div class="position-absolute bottom-0 start-0 w-100 p-3 location-banner">
              <div class="d-flex justify-content-between align-items-end">
                <h1 class="text-white mb-0">{{ location.name }}</h1>
                <span *ngIf="getAvailabilityText()" 
                      class="badge rounded-pill px-3 py-2 availability-badge"
                      [ngClass]="getAvailabilityClass()">
                  {{ getAvailabilityText() }}
                </span>
              </div>
            </div>
          </div>
          
          <div class="card-body">
            <div class="row">
              <div class="col-md-8">
                <div class="mb-4">
                  <h5 class="mb-3">Location</h5>
                  <p class="mb-2">
                    <i class="bi bi-geo-alt-fill text-primary me-2"></i>
                    {{ location.address }}, {{ location.city }}, {{ location.state }}
                  </p>
                  <div id="map" class="map-container rounded shadow-sm mb-3"></div>
                </div>
                
                <div class="mb-4">
                  <h5 class="mb-3">Description</h5>
                  <p>{{ location.description || 'No description available for this parking location.' }}</p>
                </div>
                
                <div class="mb-4" *ngIf="location.slot_availabilities && location.slot_availabilities.length > 0">
                  <h5 class="mb-3">Availability</h5>
                  <div class="table-responsive">
                    <table class="table table-bordered">
                      <thead class="table-light">
                        <tr>
                          <th>Vehicle Type</th>
                          <th>Available Spots</th>
                          <th>Total Spots</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let slot of location.slot_availabilities">
                          <td>{{ slot.vehicle_type }}</td>
                          <td>{{ slot.available_slots }}</td>
                          <td>{{ slot.total_slots }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div class="mb-4" *ngIf="location.amenities && location.amenities.length">
                  <h5 class="mb-3">Amenities</h5>
                  <div class="d-flex flex-wrap gap-2">
                    <span *ngFor="let amenity of location.amenities" 
                          class="badge bg-light text-dark p-2">
                      <i class="bi bi-check-circle-fill text-success me-1"></i>
                      {{ amenity }}
                    </span>
                  </div>
                </div>

                <div class="mb-4" *ngIf="location.features && location.features.length">
                  <h5 class="mb-3">Features</h5>
                  <div class="d-flex flex-wrap gap-2">
                    <span *ngFor="let feature of location.features" 
                          class="badge bg-light text-dark p-2">
                      <i class="bi bi-check-circle-fill text-success me-1"></i>
                      {{ feature }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="col-md-4">
                <div class="card shadow-sm mb-4">
                  <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">Parking Rates</h5>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <div class="d-flex justify-content-between">
                        <span class="text-muted">Two Wheeler Rate:</span>
                        <span class="fw-bold">₹{{ location.two_wheeler_price || '0' }}/hr</span>
                      </div>
                      <div class="d-flex justify-content-between">
                        <span class="text-muted">Four Wheeler Rate:</span>
                        <span class="fw-bold">₹{{ location.four_wheeler_price || '0' }}/hr</span>
                      </div>
                    </div>
                    
                    <div class="mb-4">
                      <div class="d-flex justify-content-between">
                        <span class="text-muted">Status:</span>
                        <span class="badge" [ngClass]="location.is_active ? 'bg-success' : 'bg-danger'">
                          {{ location.is_active ? 'Active' : 'Inactive' }}
                        </span>
                      </div>
                    </div>
                    
                    <button (click)="bookParking()" class="btn btn-primary w-100 mb-2" [disabled]="!location.is_active">
                      {{ location.is_active ? 'Book Parking' : 'Currently Unavailable' }}
                    </button>
                    <small *ngIf="!location.is_active" class="text-danger d-block text-center">
                      This parking location is currently inactive
                    </small>
                  </div>
                </div>
                
                <div class="card shadow-sm">
                  <div class="card-header bg-light">
                    <h5 class="mb-0">Hours</h5>
                  </div>
                  <div class="card-body">
                    <div class="d-flex justify-content-between">
                      <span>Monday - Friday:</span>
                      <span>{{ location.opening_time || '06:00 AM' }} - {{ location.closing_time || '11:00 PM' }}</span>
                    </div>
                    <div class="d-flex justify-content-between">
                      <span>Saturday - Sunday:</span>
                      <span>{{ location.opening_time || '06:00 AM' }} - {{ location.closing_time || '11:00 PM' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card-footer bg-white">
            <button (click)="goBack()" class="btn btn-outline-secondary">
              <i class="bi bi-arrow-left me-1"></i> Back to Parking Locations
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .parking-image {
      height: 300px;
      object-fit: cover;
      object-position: center;
    }
    .location-banner {
      background: linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0));
      padding-top: 50px;
    }
    .availability-badge {
      font-size: 0.9rem;
    }
    .availability-badge.available {
      background-color: #28a745;
    }
    .availability-badge.limited {
      background-color: #ffc107;
      color: #212529;
    }
    .availability-badge.full {
      background-color: #dc3545;
    }
    .map-container {
      height: 200px;
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
    }
  `]
})
export class LocationDetailsComponent implements OnInit {
  locationId: number = 0;
  location: any = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  isUserAuthenticated: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private parkingLocationService: ParkingLocationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get location ID from route parameters
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.locationId = +idParam;
        this.loadLocationDetails();
      } else {
        this.errorMessage = 'Invalid location ID';
        this.isLoading = false;
      }
    });

    // Subscribe to authentication state
    this.authService.isAuthenticated.subscribe(isAuthenticated => {
      this.isUserAuthenticated = isAuthenticated;
    });
  }

  loadLocationDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.parkingLocationService.getParkingLocationDetails(this.locationId).subscribe({
      next: (locationData) => {
        console.log('Location details loaded:', locationData);
        this.location = locationData;
        this.isLoading = false;

        // Check for missing image and set default
        if (!this.location.image_url) {
          this.location.image_url = 'assets/images/parking1.jpg';
        }
        
        // If features is empty, provide defaults
        if (!this.location.features || !this.location.features.length) {
          this.location.features = ['Secure Parking', 'Well Lit', '24/7 Access'];
        }
        
        // Initialize map after getting location data (in a real app)
        // this.initMap();
      },
      error: (error) => {
        console.error('Error fetching location details:', error);
        this.errorMessage = 'Failed to load location details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  getAvailabilityClass(): string {
    if (!this.location) return '';
    
    const availabilityPercentage = (this.location.available_spots / this.location.total_spots) * 100;
    if (availabilityPercentage > 50) {
      return 'available';
    } else if (availabilityPercentage > 20) {
      return 'limited';
    } else {
      return 'full';
    }
  }

  getAvailabilityText(): string {
    if (!this.location) return '';
    
    const availabilityPercentage = (this.location.available_spots / this.location.total_spots) * 100;
    if (availabilityPercentage > 50) {
      return 'Available';
    } else if (availabilityPercentage > 20) {
      return 'Limited';
    } else {
      return 'Almost Full';
    }
  }

  bookParking(): void {
    // Check if user is logged in
    if (this.authService.isLoggedIn()) {
      // User is logged in, navigate to booking page
      this.router.navigate(['/parking-locations', this.locationId, 'booking']);
    } else {
      // Not logged in, redirect to login with return URL
      const redirectUrl = `/parking-locations/${this.locationId}/booking`;
      this.router.navigate(['/login'], {
        queryParams: { redirect: redirectUrl }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/parking-locations']);
  }

  // In a real app, this would initialize a map with the location
  // private initMap(): void {
  //   if (this.location && this.location.latitude && this.location.longitude) {
  //     // Map initialization code would go here
  //   }
  // }
} 