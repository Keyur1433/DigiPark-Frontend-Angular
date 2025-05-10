import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbModule],
  template: `
    <div class="container-fluid mt-4">
      <div class="row mb-4">
        <div class="col-12">
          <div class="d-flex justify-content-between align-items-center">
            <h2>Booking Details</h2>
            <button class="btn btn-outline-primary" (click)="goBack()">
              <i class="fas fa-arrow-left me-2"></i> Back
            </button>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div *ngIf="isLoading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3 text-muted">Loading booking details...</p>
      </div>

      <!-- Error message -->
      <div *ngIf="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

      <!-- Booking details -->
      <div *ngIf="!isLoading && booking" class="card shadow mb-4">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Booking #{{ booking.id }}</h5>
          <span class="badge rounded-pill" [ngClass]="getStatusClass(booking.status)">
            {{ booking.status | titlecase }}
          </span>
        </div>
        <div class="card-body">
          <div class="row mb-4">
            <div class="col-md-6">
              <h6 class="text-primary">User Information</h6>
              <p class="mb-1"><strong>Name:</strong> {{ booking.user.first_name }} {{ booking.user.last_name }}</p>
              <p class="mb-1"><strong>Contact:</strong> {{ booking.user.contact_number }}</p>
              <p class="mb-1"><strong>Email:</strong> {{ booking.user.email }}</p>
            </div>
            <div class="col-md-6">
              <h6 class="text-primary">Vehicle Information</h6>
              <p class="mb-1"><strong>Type:</strong> {{ booking.vehicle.type }}</p>
              <p class="mb-1"><strong>Vehicle:</strong> {{ booking.vehicle.brand }} {{ booking.vehicle.model }}</p>
              <p class="mb-1"><strong>Number Plate:</strong> {{ booking.vehicle.number_plate }}</p>
            </div>
          </div>

          <div class="row mb-4">
            <div class="col-md-6">
              <h6 class="text-primary">Parking Information</h6>
              <p class="mb-1"><strong>Location:</strong> {{ booking.parking_location.name }}</p>
              <p class="mb-1"><strong>Address:</strong> {{ booking.parking_location.address }}</p>
              <p class="mb-1"><strong>Slot:</strong> {{ booking.parking_slot.name }}</p>
            </div>
            <div class="col-md-6">
              <h6 class="text-primary">Booking Information</h6>
              <p class="mb-1"><strong>Check-in:</strong> {{ formatDate(booking.check_in_time) }}</p>
              <p class="mb-1"><strong>Check-out:</strong> {{ formatDate(booking.check_out_time) }}</p>
              <p class="mb-1"><strong>Amount:</strong> ₹{{ booking.amount }}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="row mt-4" *ngIf="booking.status === 'upcoming' || booking.status === 'active'">
            <div class="col-12">
              <div class="d-flex gap-2">
                <button *ngIf="booking.status === 'upcoming'" class="btn btn-success" (click)="updateStatus('checked_in')">
                  <i class="fas fa-sign-in-alt me-2"></i> Check In
                </button>
                <button *ngIf="booking.status === 'checked_in'" class="btn btn-primary" (click)="updateStatus('completed')">
                  <i class="fas fa-sign-out-alt me-2"></i> Check Out
                </button>
                <button *ngIf="booking.status === 'upcoming'" class="btn btn-danger" (click)="updateStatus('cancelled')">
                  <i class="fas fa-times me-2"></i> Cancel Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BookingDetailsComponent implements OnInit {
  booking: any = null;
  isLoading = true;
  errorMessage: string | null = null;
  userId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.userId = +idParam;
        this.loadBookingDetails();
      }
    });
  }

  loadBookingDetails(): void {
    const bookingId = this.route.snapshot.paramMap.get('bookingId');
    if (!bookingId) {
      this.errorMessage = 'Booking ID not found';
      this.isLoading = false;
      return;
    }

    this.http.get(`${environment.apiUrl}/owner/bookings/${bookingId}`)
      .subscribe({
        next: (response: any) => {
          this.booking = response.booking;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load booking details';
          this.isLoading = false;
          console.error('Error loading booking details:', error);
        }
      });
  }

  updateStatus(status: string): void {
    const bookingId = this.route.snapshot.paramMap.get('bookingId');
    if (!bookingId) return;

    this.http.post(`${environment.apiUrl}/owner/bookings/${bookingId}/update-status`, { status })
      .subscribe({
        next: (response: any) => {
          this.toastr.success(response.message || 'Status updated successfully');
          this.loadBookingDetails();
        },
        error: (error) => {
          this.toastr.error(error.error?.message || 'Failed to update status');
        }
      });
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
      case 'checked_in':
        return 'bg-primary';
      case 'upcoming':
      case 'reserved':
      case 'pending':
        return 'bg-info';
      case 'completed':
      case 'checked_out':
        return 'bg-success';
      case 'cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  goBack(): void {
    this.router.navigate(['/owner', this.userId, 'dashboard']);
  }
} 