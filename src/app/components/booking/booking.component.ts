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

  // Booking type
  isAdvancedBooking: boolean = false;

  // Date and time properties
  bookingDate: string = '';
  startTime: string = '';
  endTime: string = '';
  timeSlots: string[] = [];
  minDate: string = '';
  minTime: string = '';
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

  // Add property to store date-specific availability data
  dateAvailability: any = null;
  isLoadingDateAvailability: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: NgbModal,
    private vehicleService: VehicleService,
    private parkingLocationService: ParkingLocationService,
    private authService: AuthService,
    private bookingService: BookingService
  ) {
    // Initialize dates and times
    this.initializeDateAndTime();
  }

  private initializeDateAndTime(): void {
    const now = new Date();
    
    // Set min date to today
    this.minDate = now.toISOString().split('T')[0];
    this.bookingDate = this.minDate;

    // Round current time to next 30-minute slot
    const minutes = now.getMinutes();
    const roundedMinutes = minutes < 30 ? 30 : 0;
    const hoursToAdd = minutes >= 30 ? 1 : 0;
    
    now.setMinutes(roundedMinutes);
    now.setHours(now.getHours() + hoursToAdd);
    
    // Format time as HH:mm
    this.minTime = `${now.getHours().toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
    this.startTime = this.minTime;

    // Generate time slots
    this.generateTimeSlots();
  }

  private generateTimeSlots(): void {
    this.timeSlots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of ['00', '30']) {
        this.timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute}`);
      }
    }
  }

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      this.showLoginRequiredModal();
      return;
    }

    // Get parking location id and booking type from route params
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

    // Check if this is an advanced booking
    this.route.queryParamMap.subscribe(params => {
      this.isAdvancedBooking = params.get('type') === 'advanced';
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
      this.selectedSlotId = null;
      
      // Load available slots if we have all required information for advanced booking
      if (this.isAdvancedBooking && this.bookingDate && this.startTime && this.endTime) {
        this.loadAvailableSlots();
      } else if (!this.isAdvancedBooking) {
        // For check-in, just load slots based on duration
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

  // Handle changes in duration (for check-in booking)
  onDurationChange(): void {
    if (!this.isAdvancedBooking && this.durationHours) {
      const now = new Date();
      const startMinutes = now.getMinutes();
      const roundedStartMinutes = startMinutes < 30 ? 30 : 0;
      const hoursToAdd = startMinutes >= 30 ? 1 : 0;
      
      now.setMinutes(roundedStartMinutes);
      now.setHours(now.getHours() + hoursToAdd);
      
      // Set start time
      this.startTime = `${now.getHours().toString().padStart(2, '0')}:${roundedStartMinutes.toString().padStart(2, '0')}`;
      
      // Calculate end time
      const endDate = new Date(now.getTime() + (this.durationHours * 60 * 60 * 1000));
      
      // Check if booking crosses midnight
      if (endDate.getDate() !== now.getDate()) {
        // Calculate remaining hours until midnight
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const hoursUntilMidnight = (midnight.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        this.errorMessage = `Your booking duration crosses into the next day. Please make two separate bookings:
          1. First booking from ${this.startTime} to 00:00 (${Math.floor(hoursUntilMidnight)} hours)
          2. Second booking from 00:00 to ${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')} (${this.durationHours - Math.floor(hoursUntilMidnight)} hours)`;
        
        // Reset duration to maximum possible for current day
        this.durationHours = Math.floor(hoursUntilMidnight);
        
        // Update end time to midnight
        this.endTime = '00:00';
      } else {
        this.errorMessage = null;
        this.endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      }
      
      if (this.selectedVehicle) {
        this.loadAvailableSlots();
      }
    }
  }

  // Handle changes in start time (for advanced booking)
  onStartTimeChange(): void {
    if (this.isAdvancedBooking && this.startTime) {
      const [hours, minutes] = this.startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      // Calculate end time (default to 1 hour if no duration set)
      const duration = this.durationHours || 1;
      const endDate = new Date(startDate.getTime() + (duration * 60 * 60 * 1000));
      
      this.endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      
      if (this.selectedVehicle && this.bookingDate) {
        this.loadAvailableSlots();
      }
    }
  }

  // Calculate duration when end time changes (for advanced booking)
  onEndTimeChange(): void {
    if (this.startTime && this.endTime) {
      // Calculate duration in hours
      const start = new Date(`2023-01-01T${this.startTime}`);
      const end = new Date(`2023-01-01T${this.endTime}`);
      const diffMs = end.getTime() - start.getTime();
      this.durationHours = diffMs / (1000 * 60 * 60);
      
      console.log('Duration calculated:', this.durationHours);
      
      // If everything is selected, load available slots
      if (this.selectedVehicleId && this.bookingDate) {
        this.loadAvailableSlots();
      }
    }
  }

  // Load available slots for the selected date, time range, and vehicle type
  loadAvailableSlots(): void {
    if (!this.parkingLocationId || !this.startTime || !this.endTime || !this.selectedVehicle) {
      return;
    }

    this.isLoadingSlots = true;
    this.errorMessage = null;
    this.selectedSlotId = null;
    this.showSlotSelection = false;

    // For check-in bookings, use today's date
    const bookingDate = this.isAdvancedBooking ? this.bookingDate : new Date().toISOString().split('T')[0];

    this.bookingService.getAvailableSlots(
      Number(this.parkingLocationId),
      bookingDate,
      this.startTime,
      this.endTime,
      this.selectedVehicle.type
    ).subscribe({
      next: (response) => {
        this.isLoadingSlots = false;
        
        if (response && response.slots) {
          this.availableSlots = response.slots;
          this.slotAvailabilities = response.slot_availabilities || [];
          
          // Separate slots by vehicle type
          this.twoWheelerSlots = this.availableSlots.filter(slot => slot.vehicle_type === '2-wheeler');
          this.fourWheelerSlots = this.availableSlots.filter(slot => slot.vehicle_type === '4-wheeler');
          
          this.showSlotSelection = true;
        } else {
          this.errorMessage = 'No slots available for the selected time period.';
        }
      },
      error: (error) => {
        this.isLoadingSlots = false;
        this.errorMessage = error.error?.message || 'Failed to load available slots. Please try again.';
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
    if (!this.selectedVehicleId || !this.selectedSlotId) {
      return false;
    }

    if (this.isAdvancedBooking) {
      return !!(this.bookingDate && this.startTime && this.endTime);
    }

    return this.durationHours > 0;
  }

  // Book the parking slot
  bookParking(): void {
    // Extended validation checks
    console.log("Validating booking form...");
    console.log("Selected vehicle:", this.selectedVehicleId);
    console.log("Selected slot:", this.selectedSlotId);
    console.log("Is advanced booking:", this.isAdvancedBooking);
    
    if (this.isAdvancedBooking) {
      console.log("Date:", this.bookingDate);
      console.log("Start time:", this.startTime);
      console.log("End time:", this.endTime);
    } else {
      console.log("Duration hours:", this.durationHours);
    }
    
    if (!this.selectedVehicleId) {
      this.errorMessage = 'Please select a vehicle.';
      return;
    }
    
    if (!this.selectedSlotId) {
      this.errorMessage = 'Please select a parking slot.';
      return;
    }
    
    if (this.isAdvancedBooking) {
      if (!this.bookingDate) {
        this.errorMessage = 'Please select a date.';
        return;
      }
      
      if (!this.startTime) {
        this.errorMessage = 'Please select a start time.';
        return;
      }
      
      if (!this.endTime) {
        this.errorMessage = 'Please select an end time.';
        return;
      }
      
      // Validate time difference
      const start = new Date(`2023-01-01T${this.startTime}`);
      const end = new Date(`2023-01-01T${this.endTime}`);
      const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      
      console.log(`Time difference: ${diffMinutes} minutes (${diffMinutes/60} hours)`);
      
      if (diffMinutes < 30) {
        this.errorMessage = 'Booking duration must be at least 30 minutes.';
        return;
      }
    } else {
      if (!this.durationHours || this.durationHours < 0.5) {
        this.errorMessage = 'Duration must be at least 30 minutes.';
        return;
      }
    }

    // Force a refresh of slot availability right before booking
    console.log("Refreshing available slots before booking...");
    
    // For advanced booking, verify slot availability one more time
    if (this.isAdvancedBooking && this.bookingDate && this.startTime && this.endTime && this.selectedVehicle) {
      this.isBooking = true;
      this.bookingService.getAvailableSlots(
        Number(this.parkingLocationId),
        this.bookingDate,
        this.startTime,
        this.endTime,
        this.selectedVehicle.type
      ).subscribe({
        next: (response) => {
          if (response && response.slots) {
            // Check if our selected slot is still available
            const slotStillAvailable = response.slots.find(
              (slot: ParkingSlot) => slot.id === this.selectedSlotId && slot.is_available_for_time_range
            );
            
            if (!slotStillAvailable) {
              this.errorMessage = "The selected slot is no longer available. Please select another slot.";
              this.isBooking = false;
              // Refresh available slots
              this.availableSlots = response.slots;
              this.showSlotSelection = true;
              this.selectedSlotId = null;
              return;
            }
            
            // If slot is still available, proceed with booking
            this.proceedWithBooking();
          } else {
            this.errorMessage = 'No slots available for the selected time period.';
            this.isBooking = false;
          }
        },
        error: (error) => {
          console.error('Error refreshing slots:', error);
          // Still proceed with booking attempt, maybe the error is temporary
          this.proceedWithBooking();
        }
      });
    } else {
      // For check-in booking, proceed directly
      this.proceedWithBooking();
    }
  }

  // Extract the booking logic to a separate method
  private proceedWithBooking(): void {
    this.errorMessage = null;

    // Log what type of booking we're creating
    console.log(`Creating ${this.isAdvancedBooking ? 'advanced' : 'check-in'} booking`);

    const bookingData = this.isAdvancedBooking ? {
      parking_location_id: Number(this.parkingLocationId),
      vehicle_id: Number(this.selectedVehicleId),
      parking_slot_id: Number(this.selectedSlotId),
      date: this.bookingDate,
      start_time: this.startTime,
      end_time: this.endTime
    } : {
      parking_location_id: Number(this.parkingLocationId),
      vehicle_id: Number(this.selectedVehicleId),
      parking_slot_id: Number(this.selectedSlotId),
      duration_hours: this.durationHours
    };

    console.log('Booking data being sent to service:', JSON.stringify(bookingData));

    const bookingMethod = this.isAdvancedBooking ? 
      this.bookingService.createAdvancedBooking(bookingData) :
      this.bookingService.createBooking(bookingData);

    bookingMethod.subscribe({
      next: (response: any) => {
        console.log('Booking created successfully:', response);
        this.successMessage = 'Booking created successfully!';
        this.isBooking = false;
        
        // Redirect to dashboard with success message
        setTimeout(() => {
          const userId = this.authService.getUserId();
          this.router.navigate(['/user', userId, 'dashboard'], {
            queryParams: { booking_success: 'true', booking_id: response?.booking?.id || 'new' }
          });
        }, 1500);
      },
      error: (error: any) => {
        this.handleBookingError(error);
      }
    });
  }

  // Extract error handling to a separate method
  private handleBookingError(error: any): void {
    console.error('Error creating booking:', error);
    
    // Extract the error message
    let errorMsg = 'Failed to book parking. Please try again.';
    if (error.error && error.error.message) {
      errorMsg = error.error.message;
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    // Check for specific error conditions
    if (error.status === 422) {
      console.error("Validation error details:", error.error);
      
      // Handle Laravel validation errors which are usually in error.error.errors
      if (error.error && error.error.errors) {
        const validationErrors = error.error.errors;
        console.error("Validation errors:", validationErrors);
        
        // Convert validation errors to readable message
        const errorMessages = [];
        for (const field in validationErrors) {
          if (validationErrors.hasOwnProperty(field)) {
            errorMessages.push(`${field}: ${validationErrors[field].join(', ')}`);
          }
        }
        
        if (errorMessages.length > 0) {
          errorMsg = `Validation errors: ${errorMessages.join('; ')}`;
        }
      }
    } else if (error.status === 0) {
      errorMsg = 'Network error. Please check your internet connection.';
    } else if (error.status === 500) {
      errorMsg = 'Server error. Please try again later.';
    }
    
    this.errorMessage = errorMsg;
    this.isBooking = false;
  }

  // Handle date change for advanced booking
  onDateChange(): void {
    if (this.isAdvancedBooking && this.bookingDate && this.parkingLocationId) {
      this.loadSlotAvailabilityForDate();
      
      // Reset slot selection
      this.selectedSlotId = null;
      
      // If we have all required information, load available slots
      if (this.startTime && this.endTime && this.selectedVehicle) {
        this.loadAvailableSlots();
      }
    }
  }

  // Load slot availability for the selected date
  loadSlotAvailabilityForDate(): void {
    if (!this.parkingLocationId || !this.bookingDate) return;
    
    this.isLoadingDateAvailability = true;
    this.dateAvailability = null;
    
    this.bookingService.getSlotAvailabilityByDate(Number(this.parkingLocationId), this.bookingDate)
      .subscribe({
        next: (response) => {
          this.isLoadingDateAvailability = false;
          if (response && response.availability) {
            this.dateAvailability = response.availability;
          }
        },
        error: () => {
          this.isLoadingDateAvailability = false;
        }
      });
  }
} 