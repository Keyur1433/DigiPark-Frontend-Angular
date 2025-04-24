import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OwnerService, ParkingLocation, ParkingLocationCreate } from '../../../services/owner.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-edit-parking-location',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="container mt-4">
      <div class="card shadow">
        <div class="card-header bg-primary text-white">
          <h2 class="mb-0">Edit Parking Location</h2>
        </div>
        <div class="card-body">
          <!-- Loading spinner -->
          <div *ngIf="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading location details...</p>
          </div>
          
          <!-- Success and Error Messages -->
          <div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>
          <div *ngIf="errorMessage" class="alert alert-danger">{{ errorMessage }}</div>
          
          <!-- Warning if location is active -->
          <div *ngIf="locationIsActive" class="alert alert-warning">
            <strong>Warning:</strong> This location is currently active. Please deactivate it before making changes to avoid confusion for users.
            <button (click)="deactivateLocation()" class="btn btn-sm btn-warning ms-2">Deactivate Now</button>
          </div>

          <!-- Edit Form -->
          <form *ngIf="!isLoading" [formGroup]="parkingLocationForm" (ngSubmit)="onSubmit()">
            <!-- Basic Information Section -->
            <div class="mb-4">
              <h4 class="mb-3">Basic Information</h4>
              <div class="row g-3">
                <div class="col-md-6">
                  <label for="name" class="form-label">Parking Location Name*</label>
                  <input 
                    type="text"
                    id="name"
                    class="form-control"
                    formControlName="name"
                    [ngClass]="{'is-invalid': parkingLocationForm.get('name')?.invalid && parkingLocationForm.get('name')?.touched}"
                  >
                  <div *ngIf="parkingLocationForm.get('name')?.invalid && parkingLocationForm.get('name')?.touched" class="invalid-feedback">
                    <div *ngIf="parkingLocationForm.get('name')?.errors?.['required']">Name is required</div>
                    <div *ngIf="parkingLocationForm.get('name')?.errors?.['maxlength']">Name cannot exceed 255 characters</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Address Section -->
            <div class="mb-4">
              <h4 class="mb-3">Address</h4>
              <div class="row g-3">
                <div class="col-12">
                  <label for="address" class="form-label">Street Address*</label>
                  <input 
                    type="text"
                    id="address"
                    class="form-control"
                    formControlName="address"
                    [ngClass]="{'is-invalid': parkingLocationForm.get('address')?.invalid && parkingLocationForm.get('address')?.touched}"
                  >
                  <div *ngIf="parkingLocationForm.get('address')?.invalid && parkingLocationForm.get('address')?.touched" class="invalid-feedback">
                    <div *ngIf="parkingLocationForm.get('address')?.errors?.['required']">Address is required</div>
                    <div *ngIf="parkingLocationForm.get('address')?.errors?.['maxlength']">Address cannot exceed 255 characters</div>
                  </div>
                </div>

                <div class="col-md-6">
                  <label for="city" class="form-label">City*</label>
                  <input 
                    type="text"
                    id="city"
                    class="form-control"
                    formControlName="city"
                    [ngClass]="{'is-invalid': parkingLocationForm.get('city')?.invalid && parkingLocationForm.get('city')?.touched}"
                  >
                  <div *ngIf="parkingLocationForm.get('city')?.invalid && parkingLocationForm.get('city')?.touched" class="invalid-feedback">
                    <div *ngIf="parkingLocationForm.get('city')?.errors?.['required']">City is required</div>
                    <div *ngIf="parkingLocationForm.get('city')?.errors?.['maxlength']">City cannot exceed 100 characters</div>
                  </div>
                </div>

                <div class="col-md-4">
                  <label for="state" class="form-label">State*</label>
                  <input 
                    type="text"
                    id="state"
                    class="form-control"
                    formControlName="state"
                    [ngClass]="{'is-invalid': parkingLocationForm.get('state')?.invalid && parkingLocationForm.get('state')?.touched}"
                  >
                  <div *ngIf="parkingLocationForm.get('state')?.invalid && parkingLocationForm.get('state')?.touched" class="invalid-feedback">
                    <div *ngIf="parkingLocationForm.get('state')?.errors?.['required']">State is required</div>
                    <div *ngIf="parkingLocationForm.get('state')?.errors?.['maxlength']">State cannot exceed 100 characters</div>
                  </div>
                </div>

                <div class="col-md-2">
                  <label for="zip_code" class="form-label">ZIP Code*</label>
                  <input 
                    type="text"
                    id="zip_code"
                    class="form-control"
                    formControlName="zip_code"
                    [ngClass]="{'is-invalid': parkingLocationForm.get('zip_code')?.invalid && parkingLocationForm.get('zip_code')?.touched}"
                  >
                  <div *ngIf="parkingLocationForm.get('zip_code')?.invalid && parkingLocationForm.get('zip_code')?.touched" class="invalid-feedback">
                    <div *ngIf="parkingLocationForm.get('zip_code')?.errors?.['required']">ZIP Code is required</div>
                    <div *ngIf="parkingLocationForm.get('zip_code')?.errors?.['maxlength']">ZIP Code cannot exceed 20 characters</div>
                  </div>
                </div>

                <div class="col-md-6">
                  <label for="country" class="form-label">Country*</label>
                  <input 
                    type="text"
                    id="country"
                    class="form-control"
                    formControlName="country"
                    [ngClass]="{'is-invalid': parkingLocationForm.get('country')?.invalid && parkingLocationForm.get('country')?.touched}"
                  >
                  <div *ngIf="parkingLocationForm.get('country')?.invalid && parkingLocationForm.get('country')?.touched" class="invalid-feedback">
                    <div *ngIf="parkingLocationForm.get('country')?.errors?.['required']">Country is required</div>
                    <div *ngIf="parkingLocationForm.get('country')?.errors?.['maxlength']">Country cannot exceed 100 characters</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Coordinates Section -->
            <div class="mb-4">
              <h4 class="mb-3">Location Coordinates</h4>
              <div class="row g-3">
                <div class="col-md-6">
                  <label for="latitude" class="form-label">Latitude*</label>
                  <input 
                    type="number"
                    id="latitude"
                    class="form-control"
                    formControlName="latitude"
                    step="0.0000001"
                    [ngClass]="{'is-invalid': parkingLocationForm.get('latitude')?.invalid && parkingLocationForm.get('latitude')?.touched}"
                  >
                  <div *ngIf="parkingLocationForm.get('latitude')?.invalid && parkingLocationForm.get('latitude')?.touched" class="invalid-feedback">
                    <div *ngIf="parkingLocationForm.get('latitude')?.errors?.['required']">Latitude is required</div>
                    <div *ngIf="parkingLocationForm.get('latitude')?.errors?.['min'] || parkingLocationForm.get('latitude')?.errors?.['max']">Latitude must be between -90 and 90</div>
                  </div>
                  <small class="form-text text-muted">Example: 34.0522</small>
                </div>

                <div class="col-md-6">
                  <label for="longitude" class="form-label">Longitude*</label>
                  <input 
                    type="number"
                    id="longitude"
                    class="form-control"
                    formControlName="longitude"
                    step="0.0000001"
                    [ngClass]="{'is-invalid': parkingLocationForm.get('longitude')?.invalid && parkingLocationForm.get('longitude')?.touched}"
                  >
                  <div *ngIf="parkingLocationForm.get('longitude')?.invalid && parkingLocationForm.get('longitude')?.touched" class="invalid-feedback">
                    <div *ngIf="parkingLocationForm.get('longitude')?.errors?.['required']">Longitude is required</div>
                    <div *ngIf="parkingLocationForm.get('longitude')?.errors?.['min'] || parkingLocationForm.get('longitude')?.errors?.['max']">Longitude must be between -180 and 180</div>
                  </div>
                  <small class="form-text text-muted">Example: -118.2437</small>
                </div>
              </div>
            </div>

            <!-- Capacity Section -->
            <div class="mb-4">
              <h4 class="mb-3">Parking Capacity</h4>
              <div class="row g-3">
                <div class="col-md-6">
                  <label for="two_wheeler_capacity" class="form-label">Two Wheeler Capacity*</label>
                  <input 
                    type="number"
                    id="two_wheeler_capacity"
                    class="form-control"
                    formControlName="two_wheeler_capacity"
                    min="0"
                    step="1"
                    [ngClass]="{'is-invalid': parkingLocationForm.get('two_wheeler_capacity')?.invalid && parkingLocationForm.get('two_wheeler_capacity')?.touched}"
                  >
                  <div *ngIf="parkingLocationForm.get('two_wheeler_capacity')?.invalid && parkingLocationForm.get('two_wheeler_capacity')?.touched" class="invalid-feedback">
                    <div *ngIf="parkingLocationForm.get('two_wheeler_capacity')?.errors?.['required']">Two wheeler capacity is required</div>
                    <div *ngIf="parkingLocationForm.get('two_wheeler_capacity')?.errors?.['min']">Value must be non-negative</div>
                    <div *ngIf="parkingLocationForm.get('two_wheeler_capacity')?.errors?.['pattern']">Value must be a whole number</div>
                  </div>
                </div>

                <div class="col-md-6">
                  <label for="four_wheeler_capacity" class="form-label">Four Wheeler Capacity*</label>
                  <input 
                    type="number"
                    id="four_wheeler_capacity"
                    class="form-control"
                    formControlName="four_wheeler_capacity"
                    min="0"
                    step="1"
                    [ngClass]="{'is-invalid': parkingLocationForm.get('four_wheeler_capacity')?.invalid && parkingLocationForm.get('four_wheeler_capacity')?.touched}"
                  >
                  <div *ngIf="parkingLocationForm.get('four_wheeler_capacity')?.invalid && parkingLocationForm.get('four_wheeler_capacity')?.touched" class="invalid-feedback">
                    <div *ngIf="parkingLocationForm.get('four_wheeler_capacity')?.errors?.['required']">Four wheeler capacity is required</div>
                    <div *ngIf="parkingLocationForm.get('four_wheeler_capacity')?.errors?.['min']">Value must be non-negative</div>
                    <div *ngIf="parkingLocationForm.get('four_wheeler_capacity')?.errors?.['pattern']">Value must be a whole number</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pricing Section -->
            <div class="mb-4">
              <h4 class="mb-3">Hourly Pricing</h4>
              <div class="row g-3">
                <div class="col-md-6">
                  <label for="two_wheeler_hourly_rate" class="form-label">Two Wheeler Hourly Rate (₹)*</label>
                  <input 
                    type="number"
                    id="two_wheeler_hourly_rate"
                    class="form-control"
                    formControlName="two_wheeler_hourly_rate"
                    min="0"
                    step="0.01"
                    [ngClass]="{'is-invalid': parkingLocationForm.get('two_wheeler_hourly_rate')?.invalid && parkingLocationForm.get('two_wheeler_hourly_rate')?.touched}"
                  >
                  <div *ngIf="parkingLocationForm.get('two_wheeler_hourly_rate')?.invalid && parkingLocationForm.get('two_wheeler_hourly_rate')?.touched" class="invalid-feedback">
                    <div *ngIf="parkingLocationForm.get('two_wheeler_hourly_rate')?.errors?.['required']">Two wheeler hourly rate is required</div>
                    <div *ngIf="parkingLocationForm.get('two_wheeler_hourly_rate')?.errors?.['min']">Value must be non-negative</div>
                  </div>
                </div>

                <div class="col-md-6">
                  <label for="four_wheeler_hourly_rate" class="form-label">Four Wheeler Hourly Rate (₹)*</label>
                  <input 
                    type="number"
                    id="four_wheeler_hourly_rate"
                    class="form-control"
                    formControlName="four_wheeler_hourly_rate"
                    min="0"
                    step="0.01"
                    [ngClass]="{'is-invalid': parkingLocationForm.get('four_wheeler_hourly_rate')?.invalid && parkingLocationForm.get('four_wheeler_hourly_rate')?.touched}"
                  >
                  <div *ngIf="parkingLocationForm.get('four_wheeler_hourly_rate')?.invalid && parkingLocationForm.get('four_wheeler_hourly_rate')?.touched" class="invalid-feedback">
                    <div *ngIf="parkingLocationForm.get('four_wheeler_hourly_rate')?.errors?.['required']">Four wheeler hourly rate is required</div>
                    <div *ngIf="parkingLocationForm.get('four_wheeler_hourly_rate')?.errors?.['min']">Value must be non-negative</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Form Buttons -->
            <div class="d-flex gap-2 mt-4">
              <button type="button" class="btn btn-secondary" [routerLink]="['/owner', userId, 'parking-locations']">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="isSubmitting || locationIsActive || parkingLocationForm.invalid">
                <span *ngIf="isSubmitting" class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                Update Parking Location
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class EditParkingLocationComponent implements OnInit {
  parkingLocationForm: FormGroup;
  isLoading = true;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  userId: number | null = null;
  locationId: number | null = null;
  locationIsActive = false;
  originalLocation: ParkingLocation | null = null;

  constructor(
    private fb: FormBuilder,
    private ownerService: OwnerService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.parkingLocationForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(255)]],
      address: ['', [Validators.required, Validators.maxLength(255)]],
      city: ['', [Validators.required, Validators.maxLength(100)]],
      state: ['', [Validators.required, Validators.maxLength(100)]],
      country: ['', [Validators.required, Validators.maxLength(100)]],
      zip_code: ['', [Validators.required, Validators.maxLength(20)]],
      latitude: [null, [Validators.required, Validators.min(-90), Validators.max(90)]],
      longitude: [null, [Validators.required, Validators.min(-180), Validators.max(180)]],
      two_wheeler_capacity: [null, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]],
      four_wheeler_capacity: [null, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]],
      two_wheeler_hourly_rate: [null, [Validators.required, Validators.min(0)]],
      four_wheeler_hourly_rate: [null, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    // Get user ID from parent route
    this.route.parent?.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.userId = +idParam;
      } else {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.id) {
          this.userId = currentUser.id;
        }
      }
    });

    // Get location ID from current route
    this.route.paramMap.subscribe(params => {
      const locationIdParam = params.get('locationId');
      if (locationIdParam) {
        this.locationId = +locationIdParam;
        this.loadLocationDetails();
      } else {
        this.errorMessage = 'No location ID provided';
        this.isLoading = false;
      }
    });
  }

  loadLocationDetails(): void {
    if (!this.locationId) return;
    
    this.isLoading = true;
    this.ownerService.getParkingLocationDetails(this.locationId).subscribe({
      next: (response) => {
        const location = response.parking_location;
        this.originalLocation = location;
        this.locationIsActive = location.is_active;
        
        // Populate form with location data, handling missing fields
        this.parkingLocationForm.patchValue({
          name: location.name,
          address: location.address,
          city: location.city,
          state: location.state,
          // Some fields might not exist in the location object, so provide defaults
          country: '',
          zip_code: location.pincode || '',
          latitude: location.latitude,
          longitude: location.longitude,
          two_wheeler_capacity: location.two_wheeler_capacity,
          four_wheeler_capacity: location.four_wheeler_capacity,
          two_wheeler_hourly_rate: location.two_wheeler_price_per_hour,
          four_wheeler_hourly_rate: location.four_wheeler_price_per_hour
        });
        
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Failed to load location details. Please try again.';
        }
      }
    });
  }

  deactivateLocation(): void {
    if (!this.locationId) return;
    
    this.isLoading = true;
    this.ownerService.toggleParkingLocationStatus(this.locationId).subscribe({
      next: () => {
        this.locationIsActive = false;
        this.successMessage = 'Location deactivated successfully. You can now edit it.';
        this.isLoading = false;
        
        // Automatically dismiss success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Failed to deactivate location. Please try again.';
        }
      }
    });
  }

  onSubmit(): void {
    if (this.parkingLocationForm.invalid) {
      this.markFormGroupTouched(this.parkingLocationForm);
      return;
    }

    if (this.locationIsActive) {
      this.errorMessage = 'Cannot update an active location. Please deactivate it first.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.locationId) {
      this.errorMessage = 'No location ID provided';
      this.isSubmitting = false;
      return;
    }

    const locationData: ParkingLocationCreate = {
      ...this.parkingLocationForm.value,
      // Ensure numeric fields are converted to numbers
      latitude: parseFloat(this.parkingLocationForm.value.latitude),
      longitude: parseFloat(this.parkingLocationForm.value.longitude),
      two_wheeler_capacity: parseInt(this.parkingLocationForm.value.two_wheeler_capacity, 10),
      four_wheeler_capacity: parseInt(this.parkingLocationForm.value.four_wheeler_capacity, 10),
      two_wheeler_hourly_rate: parseFloat(this.parkingLocationForm.value.two_wheeler_hourly_rate),
      four_wheeler_hourly_rate: parseFloat(this.parkingLocationForm.value.four_wheeler_hourly_rate)
    };

    this.ownerService.updateParkingLocation(this.locationId, locationData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = 'Parking location updated successfully!';
        
        // Redirect after a brief delay to show success message
        setTimeout(() => {
          if (this.userId) {
            this.router.navigate([`/owner/${this.userId}/parking-locations`]);
          }
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting = false;
        
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else if (error.error && typeof error.error === 'object') {
          // Handle validation errors
          const errorMessages = [];
          for (const key in error.error) {
            if (error.error[key]) {
              errorMessages.push(`${key}: ${error.error[key]}`);
            }
          }
          this.errorMessage = errorMessages.join(', ');
        } else {
          this.errorMessage = 'Failed to update parking location. Please try again.';
        }
      }
    });
  }

  // Helper method to mark all form controls as touched
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
} 