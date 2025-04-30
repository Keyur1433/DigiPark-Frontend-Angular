import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbModal, NgbModalRef, NgbDatepickerModule, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';

import { VehicleService, Vehicle } from '../../services/vehicle.service';
import { ParkingLocationService } from '../../services/parking-location.service';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';

import { ParkingLocation } from '../../models/parking-location.model';

interface ParkingSlot {
  id: number;
  slot_number: string;
  vehicle_type: string;
  is_active: boolean;
  is_occupied: boolean;
  has_upcoming_booking: boolean;
  is_available_for_time_range: boolean;
  bookings: any[];
  status: string;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgbDatepickerModule, NgbTimepickerModule],
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

  // New properties for slot selection
  bookingDate: string = '';
  startTime: string = '';
  endTime: string = '';
  availableSlots: ParkingSlot[] = [];
  selectedSlotId: number | null = null;
  twoWheelerSlots: ParkingSlot[] = [];
  fourWheelerSlots: ParkingSlot[] = [];
  isLoadingSlots: boolean = false;
  slotAvailabilities: any[] = [];
  showSlotSelection: boolean = false;

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
  ) {
    // Initialize today's date in YYYY-MM-DD format
    const today = new Date();
    this.bookingDate = today.toISOString().split('T')[0];
    
    // Initialize start time to current hour + 30 minutes, rounded to nearest 30 minutes
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    const roundedMinute = currentMinute < 30 ? 30 : 0;
    const roundedHour = roundedMinute === 0 && currentMinute >= 30 ? currentHour + 1 : currentHour;
    
    this.startTime = `${roundedHour.toString().padStart(2, '0')}:${roundedMinute.toString().padStart(2, '0')}`;
    
    // Initialize end time to start time + 1 hour
    const endDate = new Date();
    endDate.setHours(roundedHour + 1);
    endDate.setMinutes(roundedMinute);
    this.endTime = `${endDate.getHours().toString().padStart(2, '0')}:${roundedMinute.toString().padStart(2, '0')}`;
  }

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
      // Reset slot selection when vehicle changes
      this.selectedSlotId = null;
      // Load available slots if we have all the required information
      if (this.bookingDate && this.startTime && this.endTime) {
        this.loadAvailableSlots();
      }
    } else {
      this.selectedVehicle = null;
      this.currentHourlyRate = 0;
      this.showSlotSelection = false;
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
    if (this.durationHours && this.startTime) {
      // Update end time based on duration
      const [hours, minutes] = this.startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      // Calculate end time by adding duration hours
      const endDate = new Date(startDate.getTime() + (this.durationHours * 60 * 60 * 1000));
      const endHours = endDate.getHours().toString().padStart(2, '0');
      const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
      
      this.endTime = `${endHours}:${endMinutes}`;
      
      // Reload available slots if we have all the required information
      if (this.bookingDate && this.selectedVehicle) {
        this.loadAvailableSlots();
      }
    }
  }

  // Handle changes in start time
  onStartTimeChange(): void {
    if (this.startTime && this.durationHours) {
      // Update end time based on start time and duration
      const [hours, minutes] = this.startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      // Calculate end time by adding duration hours
      const endDate = new Date(startDate.getTime() + (this.durationHours * 60 * 60 * 1000));
      const endHours = endDate.getHours().toString().padStart(2, '0');
      const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
      
      this.endTime = `${endHours}:${endMinutes}`;
      
      // Reload available slots if we have all the required information
      if (this.bookingDate && this.selectedVehicle) {
        this.loadAvailableSlots();
      }
    }
  }

  // Load available slots for the selected date, time range, and vehicle type
  loadAvailableSlots(): void {
    if (!this.parkingLocationId || !this.bookingDate || !this.startTime || !this.endTime || !this.selectedVehicle) {
      return;
    }

    this.isLoadingSlots = true;
    this.errorMessage = null;
    this.selectedSlotId = null;
    this.showSlotSelection = false;

    const vehicleType = this.selectedVehicle.type;

    this.bookingService.getAvailableSlots(
      this.parkingLocationId,
      this.bookingDate,
      this.startTime,
      this.endTime,
      vehicleType
    ).subscribe({
      next: (response) => {
        this.isLoadingSlots = false;
        
        if (response && response.slots) {
          this.availableSlots = response.slots;
          this.slotAvailabilities = response.slot_availabilities || [];
          
          // Separate slots by vehicle type
          this.twoWheelerSlots = this.availableSlots.filter(slot => slot.vehicle_type === '2-wheeler');
          this.fourWheelerSlots = this.availableSlots.filter(slot => slot.vehicle_type === '4-wheeler');
          
          console.log('Available slots loaded:', this.availableSlots.length);
          console.log('Two-wheeler slots:', this.twoWheelerSlots.length);
          console.log('Four-wheeler slots:', this.fourWheelerSlots.length);
          
          this.showSlotSelection = true;
        } else {
          this.errorMessage = 'Failed to load available slots.';
        }
      },
      error: (error) => {
        this.isLoadingSlots = false;
        this.errorMessage = 'Failed to load available slots. Please try again.';
      }
    });
  }

  // Select or deselect a slot
  toggleSlotSelection(slot: ParkingSlot): void {
    if (!slot.is_available_for_time_range) {
      return; // Can't select unavailable slots
    }
    
    if (this.selectedSlotId === slot.id) {
      // Deselect if already selected
      this.selectedSlotId = null;
    } else {
      // Select new slot
      this.selectedSlotId = slot.id;
    }
  }

  // Get the CSS class for a slot based on its status
  getSlotClass(slot: ParkingSlot): string {
    if (this.selectedSlotId === slot.id) {
      return 'slot-selected';
    } else if (!slot.is_available_for_time_range) {
      return slot.is_occupied ? 'slot-occupied' : 'slot-reserved';
    } else {
      return 'slot-available';
    }
  }

  // Get the selected slot number
  getSelectedSlotNumber(): string {
    if (!this.selectedSlotId || this.availableSlots.length === 0) return '';
    
    const selectedSlot = this.availableSlots.find(slot => slot.id === this.selectedSlotId);
    return selectedSlot ? selectedSlot.slot_number : '';
  }

  // Check if form is valid for booking
  isFormValid(): boolean {
    return !!(
      this.selectedVehicleId && 
      this.bookingDate && 
      this.startTime && 
      this.endTime && 
      this.durationHours &&
      this.selectedSlotId
    );
  }

  // Book the parking slot
  bookParking(): void {
    if (!this.isFormValid()) {
      this.errorMessage = 'Please complete all required fields and select a parking slot.';
      return;
    }

    this.isBooking = true;
    this.errorMessage = null;
    this.successMessage = null;

    // Calculate duration in hours based on start and end time
    const [startHours, startMinutes] = this.startTime.split(':').map(Number);
    const [endHours, endMinutes] = this.endTime.split(':').map(Number);
    const startTimeMinutes = startHours * 60 + startMinutes;
    const endTimeMinutes = endHours * 60 + endMinutes;
    const durationMinutes = endTimeMinutes - startTimeMinutes;
    const calculatedDuration = durationMinutes / 60;

    // Prepare booking data in the format expected by the backend API
    const bookingData = {
      parking_location_id: parseInt(this.parkingLocationId!, 10),
      vehicle_id: parseInt(this.selectedVehicleId!, 10),
      parking_slot_id: this.selectedSlotId,
      duration_hours: calculatedDuration,
      booking_date: this.bookingDate,
      start_time: this.startTime,
      end_time: this.endTime,
      amount: this.getTotalAmount()
    };

    console.log('Sending booking request with slot selection:', bookingData);

    // Send booking request
    this.bookingService.createBooking(bookingData)
      .subscribe({
        next: (response: any) => {
          console.log('Booking response received:', response);
          this.isBooking = false;
          
          if (response && response.success) {
            this.successMessage = response.message || 'Booking successful! Your parking is confirmed.';
          } else if (response && response.message) {
            this.successMessage = response.message;
          } else {
          this.successMessage = 'Booking successful! Your parking is confirmed.';
          }
          
          // Store the booking ID in localStorage to ensure it can be referenced later
          try {
            if (response && response.booking && response.booking.id) {
              const bookingId = response.booking.id.toString();
              console.log('Storing booking ID in localStorage:', bookingId);
              
              // Store as a recent booking
              const recentBookings = JSON.parse(localStorage.getItem('recent_bookings') || '[]');
              recentBookings.unshift(bookingId);
              localStorage.setItem('recent_bookings', JSON.stringify(recentBookings.slice(0, 10)));
              
              // Also store the full booking data if available
              if (response.booking) {
                try {
                  const bookingsCache = JSON.parse(localStorage.getItem('bookings_cache') || '{}');
                  bookingsCache[bookingId] = {
                    data: response.booking,
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
                        this.router.navigate(['/user', userId, 'dashboard']);
                      }, 2000);
                    } else {
                      console.error('User not found after refresh');
                      this.router.navigate(['/']);
                    }
                  },
                  error: (error) => {
                    console.error('Error fetching user after booking:', error);
                    this.router.navigate(['/']);
                  }
                });
              } else {
                console.error('User not authenticated after refresh');
                this.router.navigate(['/']);
              }
            },
            error: (error) => {
              console.error('Error refreshing auth state after booking:', error);
              this.router.navigate(['/']);
            }
          });
        },
        error: (error) => {
          this.isBooking = false;
          console.error('Booking error:', error);
          
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'Booking failed. Please try again.';
          }
        }
      });
  }
} 