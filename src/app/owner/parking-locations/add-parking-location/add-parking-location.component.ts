import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OwnerService, ParkingLocationCreate } from '../../../services/owner.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-add-parking-location',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './add-parking-location.component.html',
  // styleUrls: ['./add-parking-location.component.css']
})
export class AddParkingLocationComponent implements OnInit {
  parkingLocationForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  userId: number | null = null;

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
  }

  onSubmit(): void {
    if (this.parkingLocationForm.invalid) {
      this.markFormGroupTouched(this.parkingLocationForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

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

    this.ownerService.createParkingLocation(locationData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = 'Parking location added successfully!';
        // Reset form after successful submission
        this.parkingLocationForm.reset();
        
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
          this.errorMessage = 'Failed to add parking location. Please try again.';
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