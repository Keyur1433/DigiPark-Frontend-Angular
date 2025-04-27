import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { VehicleService, Vehicle } from '../../services/vehicle.service';
import { ParkingLocationService } from '../../services/parking-location.service';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';

import { ParkingLocation } from '../../models/parking-location.model';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent implements OnInit {
  @ViewChild('loginRequiredModal') loginRequiredModal: any;

  parkingLocationId: string | null = null;
  parkingLocation: ParkingLocation | null = null;
  vehicles: Vehicle[] = [];
  selectedVehicleId: string | null = null;
  selectedVehicle: Vehicle | null = null;
  durationHours: number = 1; // Default 1 hour
  currentHourlyRate: number = 0;

  isLoading: boolean = true;
  isBooking: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private vehicleService: VehicleService,
    private parkingLocationService: ParkingLocationService,
    private authService: AuthService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.showLoginRequiredModal();
      return;
    }

    // Get parking location id from route params
    this.route.paramMap.subscribe(params => {
      this.parkingLocationId = params.get('id');
      if (this.parkingLocationId) {
        this.loadParkingLocationDetails();
        this.loadUserVehicles();
      } else {
        this.errorMessage = 'Invalid parking location.';
        this.isLoading = false;
      }
    });
  }

  loadParkingLocationDetails(): void {
    if (!this.parkingLocationId) {
      return;
    }

    this.parkingLocationService.getParkingLocationById(this.parkingLocationId)
      .subscribe({
        next: (location) => {
          this.parkingLocation = location;
          this.updateHourlyRate();
        },
        error: (error) => {
          this.errorMessage = 'Failed to load parking location details.';
        }
      });
  }

  loadUserVehicles(): void {
    this.isLoading = true;
    this.vehicleService.getUserVehicles()
      .subscribe({
        next: (vehicles) => {
          this.vehicles = vehicles;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load your vehicles.';
          this.isLoading = false;
        }
      });
  }

  showLoginRequiredModal(): void {
    const modalRef: NgbModalRef = this.modalService.open(this.loginRequiredModal, {
      centered: true,
      backdrop: 'static'
    });

    modalRef.result.then(
      () => {
        // User clicked Go to Login
        this.router.navigate(['/login'], {
          queryParams: { redirect: this.router.url }
        });
      },
      () => {
        // User dismissed the modal
        this.router.navigate(['/parking-locations']);
      }
    );
  }

  goToAddVehicle(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.router.navigate(['/user', user.id, 'vehicles']);
    } else {
      // Fallback if user info is not available
      this.router.navigate(['/user', 'vehicles']);
    }
  }

  getSelectedVehicleName(): string {
    if (!this.selectedVehicleId) return '';
    const vehicle = this.vehicles.find(v => v.id === Number(this.selectedVehicleId));
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.number_plate})` : '';
  }

  // Update the selected vehicle and recalculate hourly rate
  onVehicleSelectionChange(): void {
    if (this.selectedVehicleId) {
      this.selectedVehicle = this.vehicles.find(v => v.id === Number(this.selectedVehicleId)) || null;
      this.updateHourlyRate();
    } else {
      this.selectedVehicle = null;
      this.currentHourlyRate = 0;
    }
  }

  // Update hourly rate based on vehicle type
  updateHourlyRate(): void {
    if (!this.parkingLocation || !this.selectedVehicle) {
      return;
    }

    // Determine hourly rate based on vehicle type
    if (this.selectedVehicle.type === '2-wheeler') {
      this.currentHourlyRate = this.parkingLocation.two_wheeler_price || 0;
    } else if (this.selectedVehicle.type === '4-wheeler') {
      this.currentHourlyRate = this.parkingLocation.four_wheeler_price || this.parkingLocation.hourly_rate || 0;
    } else {
      // Default to four wheeler price if type is unknown
      this.currentHourlyRate = this.parkingLocation.hourly_rate || 0;
    }
  }

  // Calculate total amount
  getTotalAmount(): number {
    return this.currentHourlyRate * this.durationHours;
  }

  // Handle changes in duration
  onDurationChange(): void {
    // No need to update hourly rate, just recalculate total with existing rate
  }

  bookParking(): void {
    // Validate inputs
    if (!this.selectedVehicleId) {
      this.errorMessage = 'Please select a vehicle.';
      return;
    }

    if (!this.durationHours) {
      this.errorMessage = 'Please select a valid duration.';
      return;
    }

    if (!this.parkingLocationId) {
      this.errorMessage = 'Invalid parking location.';
      return;
    }

    this.isBooking = true;
    this.errorMessage = null;
    this.successMessage = null;

    // Prepare booking data
    const bookingData = {
      parking_location_id: this.parkingLocationId,
      vehicle_id: this.selectedVehicleId,
      duration_hours: this.durationHours
    };

    console.log('Sending booking request:', bookingData);

    // Send booking request
    this.bookingService.createBooking(bookingData)
      .subscribe({
        next: (response: any) => {
          console.log('Booking successful:', response);
          this.isBooking = false;
          this.successMessage = 'Booking successful! Your parking is confirmed.';
          
          // Store the booking ID in localStorage to ensure it can be referenced later
          try {
            if (response && response.id) {
              const bookingId = response.id.toString();
              console.log('Storing booking ID in localStorage:', bookingId);
              
              // Store as a recent booking
              const recentBookings = JSON.parse(localStorage.getItem('recent_bookings') || '[]');
              recentBookings.unshift(bookingId);
              localStorage.setItem('recent_bookings', JSON.stringify(recentBookings.slice(0, 10)));
              
              // Also store the full booking data if available
              if (typeof response === 'object') {
                try {
                  const bookingsCache = JSON.parse(localStorage.getItem('bookings_cache') || '{}');
                  bookingsCache[bookingId] = {
                    data: response,
                    timestamp: Date.now()
                  };
                  localStorage.setItem('bookings_cache', JSON.stringify(bookingsCache));
                  console.log('Booking data cached in localStorage');
                } catch (e) {
                  console.error('Error caching booking data:', e);
                }
              }
            }
          } catch (e) {
            console.error('Error storing recent booking', e);
          }
          
          // Ensure we have fresh user data before navigating
          this.authService.refreshAuthState().subscribe({
            next: (isAuthenticated) => {
              if (isAuthenticated) {
                console.log('Auth state refreshed, user is authenticated');
                this.authService.fetchCurrentUser().subscribe({
                  next: (user) => {
                    if (user) {
                      const userId = user.id;
                      // Navigate to user dashboard after a short delay
                      setTimeout(() => {
                        console.log('Navigating to dashboard with user ID:', userId);
                        this.router.navigate(['/user', userId, 'dashboard'], {
                          queryParams: { booking_success: 'true' }
                        });
                      }, 2000);
                    } else {
                      const fallbackUserId = this.authService.getUserId();
                      setTimeout(() => {
                        console.log('Navigating to dashboard with fallback user ID:', fallbackUserId);
                        this.router.navigate(['/user', fallbackUserId, 'dashboard'], {
                          queryParams: { booking_success: 'true' }
                        });
                      }, 2000);
                    }
                  },
                  error: (error) => {
                    // Fallback to getting ID from existing auth service if fetch fails
                    console.error('Error fetching current user after booking:', error);
                    const userId = this.authService.getUserId();
                    setTimeout(() => {
                      console.log('Navigating to dashboard with fallback user ID after fetch error:', userId);
                      this.router.navigate(['/user', userId, 'dashboard'], {
                        queryParams: { booking_success: 'true' }
                      });
                    }, 2000);
                  }
                });
              } else {
                console.error('User not authenticated after booking, redirecting to login');
                this.router.navigate(['/login']);
              }
            },
            error: (error) => {
              console.error('Error refreshing auth state after booking:', error);
              this.router.navigate(['/login']);
            }
          });
        },
        error: (error: any) => {
          this.isBooking = false;
          console.error('Booking error:', error);
          
          if (error.status === 422) {
            this.errorMessage = error.error?.message || 'Validation failed.';
          } else if (error.status === 403) {
            this.errorMessage = 'You are not authorized to make this booking.';
          } else if (error.status === 409) {
            this.errorMessage = 'This vehicle is already parked.';
          } else {
            this.errorMessage = 'Failed to process your booking. Please try again.';
          }
        }
      });
  }
} 