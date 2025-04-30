import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbNavModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BookingService } from '../../../services/booking.service';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { formatDate } from '@angular/common';
import { catchError, of } from 'rxjs';

interface BookingDisplay {
  id: string;
  location: string;
  vehicle: string;
  entry_time: Date;
  exit_time: Date | null;
  status: string;
  amount: number;
  vehicle_id: string;
  parking_location_id: string;
}

@Component({
  selector: 'app-all-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbNavModule, DatePipe],
  templateUrl: './all-bookings.component.html',
  styleUrls: ['./all-bookings.component.css']
})
export class AllBookingsComponent implements OnInit {
  @ViewChild('bookingDetailsModal') bookingDetailsModal: any;
  
  userId: number = 0; // Default value
  allBookings: BookingDisplay[] = [];
  activeBookings: BookingDisplay[] = [];
  upcomingBookings: BookingDisplay[] = [];
  completedBookings: BookingDisplay[] = [];
  isLoading: boolean = true;
  activeTab: number = 1;
  
  // For booking details modal
  selectedBooking: any = null;
  isLoadingBookingDetails: boolean = false;
  locationMap: { [key: string]: string } = {}; // Map location IDs to names

  // Auto-refresh timer
  private refreshTimer: any;
  private readonly REFRESH_INTERVAL = 10000; // 10 seconds

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private authService: AuthService,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    // Get userId from route params
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.userId = parseInt(idParam, 10);
      } else {
        const authUserId = this.authService.getUserId();
        this.userId = authUserId || 0;
      }
      this.loadBookings();
    });
  }

  ngOnDestroy(): void {
    // Clear auto-refresh timer when component is destroyed
    this.clearRefreshTimer();
  }

  loadBookings(): void {
    this.isLoading = true;
    
    // Clear any existing refresh timer
    this.clearRefreshTimer();
    
    // Try to get bookings from localStorage first (might have been cached by dashboard)
    try {
      const cachedBookings = localStorage.getItem('all_processed_bookings');
      if (cachedBookings) {
        const bookings = JSON.parse(cachedBookings);
        if (Array.isArray(bookings) && bookings.length > 0) {
          console.log('Using cached bookings from localStorage');
          this.processBookings(bookings);
          // Set up auto-refresh after loading cached bookings
          this.setupRefreshTimer();
          return;
        }
      }
    } catch (e) {
      console.error('Error parsing cached bookings:', e);
    }
    
    // If no cached bookings, fetch from API
    this.bookingService.getUserBookings().subscribe({
      next: (bookings: any[]) => {
        console.log('Bookings fetched successfully:', bookings.length);
        this.processBookings(bookings);
        // Set up auto-refresh after loading fresh bookings
        this.setupRefreshTimer();
      },
      error: (error) => {
        console.error('Error fetching bookings:', error);
        this.toastr.error('Failed to load your bookings. Please try again later.');
        this.isLoading = false;
      }
    });
  }
  
  processBookings(bookings: any[]): void {
    // Process the bookings if they're not already in the expected format
    if (bookings.length > 0 && !bookings[0].hasOwnProperty('location')) {
      // Need to process from API format to display format
      // This would ideally call a shared service to process bookings consistently
      console.log('Processing bookings to display format');
      // Use simple format for now
      this.allBookings = bookings.map(booking => ({
        id: booking.id?.toString() || '',
        location: booking.parking_location?.name || 'Unknown Location',
        vehicle: booking.vehicle?.number_plate || 'Unknown Vehicle',
        entry_time: new Date(booking.check_in_time || booking.start_time || new Date()),
        exit_time: booking.check_out_time ? new Date(booking.check_out_time) : null,
        status: this.mapBookingStatus(booking.status),
        amount: parseFloat(booking.amount || '0'),
        vehicle_id: booking.vehicle_id?.toString() || '',
        parking_location_id: booking.parking_location_id?.toString() || ''
      }));
    } else {
      // Already in the right format
      this.allBookings = bookings;
    }
    
    this.sortBookingsByStatus();
    this.isLoading = false;
  }

  mapBookingStatus(status: string): string {
    if (status === 'checked_in') return 'active';
    if (status === 'upcoming' || status === 'booked' || status === 'reserved') return 'upcoming';
    if (status === 'checked_out' || status === 'completed') return 'completed';
    if (status === 'cancelled') return 'cancelled';
    return status;
  }

  sortBookingsByStatus(): void {
    this.activeBookings = this.allBookings.filter(booking => 
      booking.status === 'active' || booking.status === 'in_progress'
    );
    
    this.upcomingBookings = this.allBookings.filter(booking => 
      booking.status === 'upcoming' || booking.status === 'reserved' || 
      booking.status === 'pending' || booking.status === 'confirmed'
    );
    
    this.completedBookings = this.allBookings.filter(booking => 
      booking.status === 'completed' || booking.status === 'cancelled'
    );
  }

  onTabChange(tabId: number): void {
    this.activeTab = tabId;
  }

  viewBookingDetails(bookingId: string): void {
    console.log('Viewing booking details for ID:', bookingId);
    this.isLoadingBookingDetails = true;
    this.selectedBooking = null;
    
    // Open the modal
    const modalRef = this.modalService.open(this.bookingDetailsModal, {
      centered: true,
      size: 'lg',
      backdrop: 'static'
    });
    
    // Fetch booking details
    this.bookingService.getBookingDetails(bookingId).subscribe({
      next: (booking) => {
        console.log('Booking details loaded:', booking);
        
        // Process booking data to ensure proper structure
        if (booking) {
          // Handle parking_slot vs parking_slot_id scenario
          if (booking.parking_slot_id && !booking.parking_slot) {
            booking.parking_slot = {
              id: booking.parking_slot_id,
              slot_number: booking.slot_number || `Slot #${booking.parking_slot_id}`,
              vehicle_type: booking.vehicle?.type || (booking.vehicle_id ? 'Vehicle' : 'Unknown')
            };
          }
          
          // Ensure we have a parking location object
          if (booking.parking_location_id && !booking.parking_location) {
            booking.parking_location = {
              id: booking.parking_location_id,
              name: this.locationMap[booking.parking_location_id] || 'Parking Location'
            };
          }
        }
        
        this.selectedBooking = booking;
        this.isLoadingBookingDetails = false;
      },
      error: (error) => {
        console.error('Error loading booking details:', error);
        this.isLoadingBookingDetails = false;
        this.selectedBooking = { error: 'Failed to load booking details' };
        
        // Close modal automatically if there's an error
        setTimeout(() => modalRef.close(), 2000);
      }
    });
  }

  // Cancel booking from the modal
  cancelBookingFromModal(bookingId: string): void {
    console.log('Cancelling booking from modal:', bookingId);
    this.cancelBooking(bookingId);
    
    // Close the modal after cancellation
    this.modalService.dismissAll();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
      case 'in_progress':
        return 'bg-primary';
      case 'upcoming':
      case 'reserved':
      case 'pending':
      case 'confirmed':
        return 'bg-info';
      case 'completed':
        return 'bg-success';
      case 'cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  formatDate(date: Date): string {
    if (!date) return '-';
    return date.toLocaleString();
  }

  cancelBooking(bookingId: string): void {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.bookingService.cancelBooking(bookingId).subscribe({
        next: (response) => {
          this.toastr.success('Booking cancelled successfully');
          
          // Update the local state without full reload
          const booking = this.allBookings.find(b => b.id === bookingId);
          if (booking) {
            booking.status = 'cancelled';
            this.sortBookingsByStatus();
          }
        },
        error: (error) => {
          console.error('Error cancelling booking:', error);
          this.toastr.error('Failed to cancel booking. Please try again later.');
        }
      });
    }
  }

  // Set up auto-refresh timer
  private setupRefreshTimer(): void {
    this.clearRefreshTimer();
    this.refreshTimer = setInterval(() => {
      console.log('All bookings: Auto-refresh timer triggered');
      // Only reload if we're not already loading
      if (!this.isLoading) {
        this.bookingService.getUserBookings().pipe(
          catchError(err => {
            console.error('Error in auto-refresh bookings:', err);
            return of([]);
          })
        ).subscribe(bookings => {
          if (bookings && bookings.length > 0) {
            console.log('All bookings: Auto-refresh got updated bookings');
            
            // Check if any booking status has changed
            const hasStatusChanges = this.hasBookingStatusChanges(this.allBookings, bookings);
            
            if (hasStatusChanges) {
              console.log('All bookings: Auto-refresh detected status changes, updating UI');
              this.processBookings(bookings);
            } else {
              console.log('All bookings: Auto-refresh no status changes detected');
            }
          }
        });
      }
    }, this.REFRESH_INTERVAL);
  }
  
  // Clear refresh timer
  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
  
  // Check if booking statuses have changed
  private hasBookingStatusChanges(oldBookings: any[], newBookings: any[]): boolean {
    if (!oldBookings || !newBookings) return false;
    
    // Create a map of old bookings by ID for easy lookup
    const oldBookingsMap = new Map();
    oldBookings.forEach(booking => {
      oldBookingsMap.set(booking.id.toString(), booking.status);
    });
    
    // Check if any new booking has a different status
    for (const newBooking of newBookings) {
      const oldStatus = oldBookingsMap.get(newBooking.id.toString());
      if (oldStatus && oldStatus !== newBooking.status) {
        console.log(`Booking #${newBooking.id} status changed: ${oldStatus} -> ${newBooking.status}`);
        return true;
      }
    }
    
    return false;
  }
} 