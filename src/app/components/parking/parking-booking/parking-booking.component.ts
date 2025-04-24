import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ParkingService, ParkingLocation } from '../../../services/parking.service';

@Component({
  selector: 'app-parking-booking',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card shadow">
            <div class="card-header bg-primary text-white">
              <h2 class="m-0">Parking Booking</h2>
            </div>
            <div class="card-body text-center py-5">
              <div *ngIf="isLoading">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Loading parking location details...</p>
              </div>
              
              <div *ngIf="!isLoading && errorMessage" class="alert alert-danger">
                {{ errorMessage }}
              </div>
              
              <div *ngIf="!isLoading && !errorMessage">
                <div *ngIf="location">
                  <h3 class="mb-3">{{ location.name }}</h3>
                  <p class="text-muted">{{ location.address }}, {{ location.city }}, {{ location.state }}</p>
                </div>
                
                <div class="coming-soon-container mt-5">
                  <i class="bi bi-clock-history display-1 text-primary mb-4"></i>
                  <h2 class="mb-4">Booking Coming Soon!</h2>
                  <p class="lead">We're working hard to bring you an amazing booking experience.</p>
                  <p>This feature will be available soon. Please check back later.</p>
                  
                  <div class="mt-5">
                    <a routerLink="/parking-locations" class="btn btn-primary me-2">
                      <i class="bi bi-arrow-left"></i> Back to Parking Locations
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .coming-soon-container {
      padding: 2rem 1rem;
    }
  `]
})
export class ParkingBookingComponent implements OnInit {
  location: ParkingLocation | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  
  constructor(
    private route: ActivatedRoute,
    private parkingService: ParkingService
  ) {}
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadParkingLocation(+id);
      } else {
        this.isLoading = false;
        this.errorMessage = 'No parking location selected';
      }
    });
  }
  
  loadParkingLocation(id: number): void {
    this.parkingService.getParkingLocation(id).subscribe({
      next: (location: ParkingLocation) => {
        this.location = location;
        this.isLoading = false;
      },
      error: (error: Error) => {
        console.error('Error loading parking location', error);
        this.errorMessage = 'Failed to load parking location details';
        this.isLoading = false;
      }
    });
  }
} 