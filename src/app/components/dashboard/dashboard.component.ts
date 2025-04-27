import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { NgbDropdownModule, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService, UserProfile } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { VehicleService, Vehicle } from '../../services/vehicle.service';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';
import { ParkingLocationService } from '../../services/parking-location.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

interface BookingSummary {
  active: number;
  completed: number;
  cancelled: number;
  upcoming: number;
}

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
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    NgbNavModule, 
    NgbDropdownModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  user: UserProfile | null = null;
  userId: number | null = null;
  userRole: string | null = null;
  activeTab = 1;
  bookings: BookingSummary = { active: 0, completed: 0, cancelled: 0, upcoming: 0 };
  recentBookings: BookingDisplay[] = [];
  allBookings: any[] = [];
  vehicles: Vehicle[] = [];
  isLoading = true;
  currentDate = new Date();
  locationMap: { [key: string]: string } = {}; // Map location IDs to names
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private vehicleService: VehicleService,
    private bookingService: BookingService,
    private parkingLocationService: ParkingLocationService
  ) {
    // Attempt to validate token immediately
    this.validateToken();
  }

  private validateToken() {
    // Check for token directly
    const token = this.authService.getToken();
    console.log('Initial token validation:', token ? 'token exists' : 'no token');
    
    if (!token) {
      console.warn('No token found at component initialization');
    }
  }

  ngOnInit(): void {
    console.log('Dashboard ngOnInit called');
    
    // Check for bookingSuccess query param to immediately refresh
    const bookingSuccess = this.route.snapshot.queryParamMap.get('booking_success');
    if (bookingSuccess === 'true') {
      console.log('Detected booking_success parameter, ensuring fresh data load');
    }
    
    // First refresh auth state to ensure we're working with up-to-date information
    this.authService.refreshAuthState().subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        console.error('Auth refresh indicates user not authenticated, redirecting to login');
        this.router.navigate(['/login']);
        return;
      }
      
      // Continue with initialization after auth refresh
      this.route.paramMap.subscribe(params => {
        const idParam = params.get('id');
        
        // Try to get user data in multiple ways to ensure we have it
        this.user = this.authService.getCurrentUser();
        
        // If user object is null, try to refresh it from the server
        if (!this.user) {
          console.log('User object not found in memory, fetching from server');
          this.authService.fetchCurrentUser().subscribe({
            next: (user) => {
              this.user = user;
              this.continueInitialization(idParam, bookingSuccess === 'true');
            },
            error: (error) => {
              console.error('Failed to fetch user data', error);
              this.isLoading = false;
              this.router.navigate(['/login']);
            }
          });
        } else {
          this.continueInitialization(idParam, bookingSuccess === 'true');
        }
      });
    });
  }
  
  // Extracted method to continue initialization after user data is available
  private continueInitialization(idParam: string | null, forceRefresh: boolean = false): void {
    console.log('Continuing dashboard initialization with user data');
    this.userId = idParam ? Number(idParam) : this.authService.getUserId();
    this.userRole = this.authService.getUserRole();
    
    if (!this.userId || !this.userRole) {
      console.error('No user ID or role available after attempts, redirecting to login');
      this.isLoading = false;
      this.router.navigate(['/login']);
      return;
    }
    
    // Check if the URL ID doesn't match the actual user ID
    if (idParam && Number(idParam) !== this.authService.getUserId()) {
      console.warn('URL ID does not match authenticated user ID, redirecting');
      this.redirectToCorrectDashboard();
      return;
    }

    // Set default active tab
    this.activeTab = 1;

    // Load initial dashboard data
    this.fetchDashboardData(forceRefresh);
  }

  // Redirect to the correct dashboard based on the user's role
  redirectToCorrectDashboard(): void {
    const userId = this.authService.getUserId();
    const userRole = this.authService.getUserRole();
    
    if (userId && userRole) {
      if (userRole === 'owner') {
        this.router.navigate(['/owner', userId, 'dashboard']);
      } else {
        this.router.navigate(['/user', userId, 'dashboard']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  fetchDashboardData(forceRefresh: boolean = false) {
    console.log('Fetching dashboard data, forceRefresh =', forceRefresh);
    this.isLoading = true;
    
    // Check if forceRefresh or it's been more than 30 seconds since last refresh
    const lastRefresh = localStorage.getItem('dashboard_last_refresh');
    const shouldRefresh = forceRefresh || 
                         !lastRefresh || 
                         (Date.now() - parseInt(lastRefresh, 10)) > 30000;
    
    // Update refresh timestamp
    localStorage.setItem('dashboard_last_refresh', Date.now().toString());
    
    // Clear any query parameters to avoid duplicate refreshes on page reload
    if (location.search) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true
      });
    }
    
    // Check for cached bookings in localStorage
    let cachedBookings: any[] = [];
    try {
      const bookingsCache = localStorage.getItem('bookings_cache');
      if (bookingsCache) {
        const cache = JSON.parse(bookingsCache);
        console.log('Found booking cache:', cache);
        
        // Convert cache object to array of booking data
        cachedBookings = Object.values(cache)
          .map((entry: any) => entry.data)
          .filter((data: any) => data && data.id);
          
        console.log('Extracted cached bookings:', cachedBookings.length);
      }
    } catch (e) {
      console.error('Error parsing booking cache:', e);
    }
    
    // Try to get recent bookings from localStorage 
    let recentBookings = [];
    try {
      const recentBookingsStr = localStorage.getItem('recent_bookings');
      if (recentBookingsStr) {
        recentBookings = JSON.parse(recentBookingsStr);
        console.log('Found recent bookings in localStorage:', recentBookings);
      }
    } catch (e) {
      console.error('Error parsing recent bookings from localStorage:', e);
    }
    
    // Fetch both vehicles and bookings in parallel
    forkJoin({
      vehicles: this.vehicleService.getUserVehicles().pipe(catchError(err => {
        console.error('Error fetching vehicles:', err);
        return of([]);
      })),
      bookings: this.bookingService.getUserBookings().pipe(catchError(err => {
        console.error('Error fetching bookings:', err);
        return of([]);
      }))
    }).subscribe({
      next: ({ vehicles, bookings }) => {
        console.log('Dashboard data received:', {
          vehiclesCount: vehicles.length,
          bookingsCount: bookings.length,
          bookingsData: bookings
        });
        
        this.vehicles = vehicles;
        
        // If we got bookings from the API, use those
        if (bookings && bookings.length > 0) {
          this.allBookings = bookings;
          console.log('Using bookings from API');
        }
        // If no bookings from API but we have cached bookings, use those
        else if (cachedBookings.length > 0) {
          console.log('Using cached bookings from localStorage');
          this.allBookings = cachedBookings;
        }
        // Otherwise the allBookings array will be empty
        else {
          this.allBookings = [];
        }
        
        // If we still have no bookings but have IDs, try direct fetch
        if (this.allBookings.length === 0 && recentBookings.length > 0) {
          console.log('No bookings from API or cache, fetching directly');
          this.fetchRecentBookingsDirectly(recentBookings);
          return;
        }
        
        // Update booking counts
        this.updateBookingSummary(this.allBookings);
        
        // Load location names for the bookings
        this.loadLocationNames(this.allBookings);
      },
      error: (error) => {
        console.error('Failed to load dashboard data', error);
        
        // If API call fails but we have cached data, use that
        if (cachedBookings.length > 0) {
          console.log('API error but using cached bookings');
          this.allBookings = cachedBookings;
          this.updateBookingSummary(cachedBookings);
          this.loadLocationNames(cachedBookings);
        } else {
          this.isLoading = false;
        }
      },
      complete: () => {
        // This is a safety fallback in case the loading state doesn't get 
        // properly set in the normal flow
        setTimeout(() => {
          if (this.isLoading) {
            console.log('Loading timeout triggered - forcing loading to false');
            this.isLoading = false;
          }
        }, 5000);
      }
    });
  }

  // Fetch recent bookings directly by ID
  fetchRecentBookingsDirectly(bookingIds: string[]) {
    console.log('Fetching recent bookings directly by ID:', bookingIds);
    
    if (!bookingIds || bookingIds.length === 0) {
      console.log('No booking IDs to fetch');
      this.isLoading = false;
      return;
    }
    
    // Fetch up to 5 most recent bookings
    const recentIds = bookingIds.slice(0, 5);
    const bookingObservables = recentIds.map(id => 
      this.bookingService.getBookingDetails(id).pipe(
        catchError(err => {
          console.error(`Error fetching booking ${id}:`, err);
          return of(null);
        })
      )
    );
    
    forkJoin(bookingObservables).subscribe({
      next: (results) => {
        console.log('Direct booking fetch results:', results);
        // Filter out nulls
        const validBookings = results.filter(b => b !== null);
        
        if (validBookings.length > 0) {
          console.log('Found valid bookings directly:', validBookings.length);
          this.allBookings = validBookings;
          this.updateBookingSummary(validBookings);
          this.loadLocationNames(validBookings);
        } else {
          console.log('No valid bookings found directly');
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Error fetching bookings directly:', error);
        this.isLoading = false;
      }
    });
  }

  // Update booking summary counts based on real bookings
  updateBookingSummary(bookings: any[]) {
    console.log('Updating booking summary with', bookings.length, 'bookings');
    
    // Reset counts
    this.bookings = { active: 0, completed: 0, cancelled: 0, upcoming: 0 };
    
    // Return early if no bookings
    if (!bookings || bookings.length === 0) {
      console.log('No bookings to process');
      return;
    }
    
    // Debug booking data
    console.log('Booking data sample:', bookings[0]);
    
    // Count bookings by status
    bookings.forEach(booking => {
      try {
        // Check if booking has a valid structure
        if (!booking || typeof booking !== 'object') {
          console.error('Invalid booking object:', booking);
          return;
        }
        
        // Map backend status to frontend status
        let status = 'completed';
        const bookingStatus = booking.status || 'unknown';
        
        console.log(`Processing booking #${booking.id} with status: ${bookingStatus}`);
        
        if (bookingStatus === 'checked_in') {
          status = 'active';
        } else if (bookingStatus === 'upcoming' || bookingStatus === 'booked' || bookingStatus === 'reserved') {
          status = 'upcoming';
        } else if (bookingStatus === 'checked_out' || bookingStatus === 'completed') {
          status = 'completed';
        } else if (bookingStatus === 'cancelled') {
          status = 'cancelled';
        }
        
        console.log(`Booking #${booking.id} status: ${bookingStatus} → ${status}`);
        
        if (status === 'active') {
          this.bookings.active++;
        } else if (status === 'completed') {
          this.bookings.completed++;
        } else if (status === 'cancelled') {
          this.bookings.cancelled++;
        } else if (status === 'upcoming') {
          this.bookings.upcoming++;
        }
      } catch (err) {
        console.error('Error processing booking status:', err, booking);
      }
    });
    
    console.log('Updated booking summary:', this.bookings);
  }

  // Load parking location names for the bookings
  loadLocationNames(bookings: any[]) {
    if (!bookings || bookings.length === 0) {
      this.isLoading = false;
      return;
    }
    
    // Get unique location IDs
    const locationIds = [...new Set(bookings.map(b => b.parking_location_id))];
    
    // Load location names for each ID
    const locationObservables = locationIds.map(id => 
      this.parkingLocationService.getParkingLocationById(id).pipe(
        map(location => ({ id, name: location.name })),
        catchError(() => of({ id, name: 'Unknown Location' }))
      )
    );
    
    // If there are no location IDs, just process the vehicles
    if (locationIds.length === 0) {
      this.processBookingsWithVehicles(bookings);
      return;
    }
    
    // Process all location requests
    forkJoin(locationObservables).subscribe({
      next: (locations) => {
        // Build location ID to name mapping
        this.locationMap = {};
        locations.forEach(loc => {
          this.locationMap[loc.id] = loc.name;
        });
        
        // Now process bookings with vehicle names
        this.processBookingsWithVehicles(bookings);
      },
      error: (error) => {
        console.error('Failed to load location names:', error);
        // Even if location fetch fails, continue with vehicle processing
        this.processBookingsWithVehicles(bookings);
      },
      complete: () => {
        // Ensure loading is false if observable completes without calling processBookingsWithVehicles
        // This is a safeguard in case of unexpected flow
        if (this.isLoading) {
          console.log('Location loading completed without processing bookings');
          this.isLoading = false;
        }
      }
    });
  }

  // Process bookings with vehicle names
  processBookingsWithVehicles(bookings: any[]) {
    try {
      if (!bookings || bookings.length === 0) {
        this.isLoading = false;
        return;
      }
      
      // Create a vehicle ID to name mapping
      const vehicleMap: { [key: string]: string } = {};
      this.vehicles.forEach(vehicle => {
        vehicleMap[vehicle.id?.toString()] = `${vehicle.number_plate} (${vehicle.brand} ${vehicle.model})`;
      });
      
      // Transform bookings to display format
      this.recentBookings = bookings.map(booking => {
        try {
          // Try to get location name from the booking object first, then fallback to the map
          let locationName = 'Unknown Location';
          if (booking.parking_location && booking.parking_location.name) {
            locationName = booking.parking_location.name;
          } else if (this.locationMap[booking.parking_location_id]) {
            locationName = this.locationMap[booking.parking_location_id];
          }
          
          // Try to get vehicle name from the booking object first, then fallback to the map
          let vehicleName = 'Unknown Vehicle';
          if (booking.vehicle && booking.vehicle.number_plate) {
            vehicleName = `${booking.vehicle.number_plate} (${booking.vehicle.brand} ${booking.vehicle.model})`;
          } else if (vehicleMap[booking.vehicle_id]) {
            vehicleName = vehicleMap[booking.vehicle_id];
          }
          
          // Map backend status to frontend status
          let status = 'completed';
          if (booking.status === 'checked_in') {
            status = 'active';
          } else if (booking.status === 'upcoming' || booking.status === 'booked') {
            status = 'upcoming';
          } else if (booking.status === 'checked_out' || booking.status === 'completed') {
            status = 'completed';
          } else if (booking.status === 'cancelled') {
            status = 'cancelled';
          }
          
          // Handle potentially missing fields in the booking object
          const checkInTime = booking.check_in_time || booking.start_time || new Date().toISOString();
          const checkOutTime = booking.check_out_time || booking.end_time;
          
          return {
            id: booking.id?.toString() || '',
            location: locationName,
            vehicle: vehicleName,
            entry_time: new Date(checkInTime),
            exit_time: checkOutTime ? new Date(checkOutTime) : null,
            status: status,
            amount: parseFloat(booking.amount || '0'),
            vehicle_id: booking.vehicle_id?.toString() || '',
            parking_location_id: booking.parking_location_id?.toString() || ''
          };
        } catch (err) {
          console.error('Error processing booking:', err, booking);
          return null;
        }
      }).filter(booking => booking !== null) as BookingDisplay[];
      
      // Sort bookings by entry time (newest first)
      this.recentBookings.sort((a, b) => b.entry_time.getTime() - a.entry_time.getTime());
    } catch (err) {
      console.error('Error in processBookingsWithVehicles:', err);
    } finally {
      // Always set loading to false, even if there's an error
      this.isLoading = false;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-primary';
      case 'completed': return 'bg-success';
      case 'cancelled': return 'bg-danger';
      case 'upcoming': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  formatDate(date: Date): string {
    if (!date) return 'N/A';
    return date.toLocaleString();
  }

  cancelBooking(bookingId: string): void {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.bookingService.cancelBooking(bookingId).subscribe({
        next: () => {
          // Update the status of the cancelled booking
          const booking = this.recentBookings.find(b => b.id === bookingId);
          if (booking) {
            booking.status = 'cancelled';
          }
          
          // Refresh the booking summary
          this.updateBookingSummary(this.allBookings.map(b => {
            if (b.id.toString() === bookingId) {
              return { ...b, status: 'cancelled' };
            }
            return b;
          }));
          
          alert('Booking cancelled successfully');
        },
        error: () => {
          alert('Failed to cancel booking. Please try again.');
        }
      });
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        // Redirect to home page instead of login
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Logout failed', error);
        this.router.navigate(['/']);
      }
    });
  }
  
  // Multi-strategy navigation method
  navigateToParkingLocations(): void {
    // Strategy 1: Try Angular Router with navigateByUrl (more direct than navigate)
    this.router.navigateByUrl('/parking-locations').then(success => {
      if (!success) {
        // Strategy 2: If router navigation fails, try traditional location change
        const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
        const targetUrl = baseHref + 'parking-locations';
        
        // Use assign for a complete page reload which can solve hydration/SSR issues
        window.location.assign(targetUrl);
      }
    }).catch(err => {
      // Strategy 3: Last resort - direct location change
      window.location.href = '/parking-locations';
    });
  }

  // Helper method to navigate to vehicles page
  navigateToVehicles(): void {
    if (this.userId) {
      this.router.navigate(['/user', this.userId, 'vehicles']);
    }
  }

  // Handle tab change
  onTabChange(tabId: number) {
    this.activeTab = tabId;
  }
} 