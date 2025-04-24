import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgbDateParserFormatter, NgbDatepickerModule, NgbModal, NgbModalRef, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../services/auth.service';
import { GlobalService } from '../../../services/global.service';
import { ParkingLocation, ParkingService } from '../../../services/parking.service';

// Custom date parser formatter for dd-mm-yyyy format
class CustomDateParserFormatter extends NgbDateParserFormatter {
  readonly DELIMITER = '-';

  parse(value: string): any {
    if (value) {
      const date = value.split(this.DELIMITER);
      return {
        day: parseInt(date[0], 10),
        month: parseInt(date[1], 10),
        year: parseInt(date[2], 10)
      };
    }
    return null;
  }

  format(date: any): string {
    return date ?
      `${this.padNumber(date.day)}${this.DELIMITER}${this.padNumber(date.month)}${this.DELIMITER}${date.year}` :
      '';
  }

  private padNumber(value: number) {
    return value.toString().padStart(2, '0');
  }
}

@Component({
  selector: 'app-parking-locations',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    NgbTimepickerModule
  ],
  templateUrl: './parking-locations.component.html',
  styleUrls: ['./parking-locations.component.css'],
  providers: [
    { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }
  ]
})
export class ParkingLocationsComponent implements OnInit, AfterViewInit {
  parkingLocations: ParkingLocation[] = [];
  filteredLocations: ParkingLocation[] = [];
  searchForm: FormGroup;
  isLoading = true; // Start with loading indicator
  error = '';
  view = 'grid'; // 'grid' or 'map'
  selectedLocation: ParkingLocation | null = null;
  showDetails = false;
  loginModalRef: NgbModalRef | null = null;
  isUserAuthenticated = false;
  currentPage = 1;
  totalItems = 0;
  totalPages = 0;
  latitude: number | null = null;
  longitude: number | null = null;

  constructor(
    private parkingService: ParkingService,
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private globalService: GlobalService
  ) {
    this.searchForm = this.fb.group({
      location: [''],
      date: [''],
      fromTime: [''],
      toTime: [''],
      area: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      vehicleType: [''],
      radius: [''],
      serviceTypes: ['']
    });

    // Initialize with empty arrays
    this.parkingLocations = [];
    this.filteredLocations = [];
  }

  ngOnInit(): void {
    this.isLoading = true;

    // Try to get data from service
    this.parkingService.getParkingLocations().subscribe({
      next: (locations) => {
        if (locations && locations.length > 0) {
          this.parkingLocations = locations;
          this.filteredLocations = [...locations];
          this.totalItems = locations.length;
          this.totalPages = Math.ceil(this.totalItems / 10);
        } else {
          // If API returns empty, show empty state
          this.parkingLocations = [];
          this.filteredLocations = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        // On error, show empty state
        this.parkingLocations = [];
        this.filteredLocations = [];
        this.isLoading = false;
      }
    });

    // Subscribe to authentication state
    this.authService.isAuthenticated.subscribe(isAuthenticated => {
      this.isUserAuthenticated = isAuthenticated;
    });
  }

  ngAfterViewInit(): void {
    // No longer need to check for mock data
  }

  loadParkingLocations(pageChange = false): void {
    this.isLoading = true;

    // Try to get the real data from API
    this.parkingService.getParkingLocations().subscribe({
      next: (locations) => {
        if (locations && locations.length > 0) {
          this.parkingLocations = locations;
          this.filteredLocations = [...locations];
          this.totalItems = locations.length;
          this.totalPages = Math.ceil(this.totalItems / 10);
        } else {
          // If API returns empty, show empty state
          this.parkingLocations = [];
          this.filteredLocations = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        // On error, show empty state
        this.parkingLocations = [];
        this.filteredLocations = [];
        this.isLoading = false;
      }
    });
  }

  searchLocations(): void {
    const searchCriteria = this.searchForm.value;
    const searchTerm = searchCriteria.location?.trim().toLowerCase();

    this.isLoading = true;
    this.error = '';

    if (!this.parkingLocations.length) {
      this.error = 'No parking locations available to search.';
      this.isLoading = false;
      return;
    }

    if (searchTerm) {
      this.filteredLocations = this.parkingLocations.filter(location =>
        (location.name && location.name.toLowerCase().includes(searchTerm)) ||
        (location.address && location.address.toLowerCase().includes(searchTerm)) ||
        (location.city && location.city.toLowerCase().includes(searchTerm))
      );

      if (this.filteredLocations.length === 0) {
        this.error = `No parking locations found matching "${searchTerm}"`;
      }
    } else {
      // If no search term, show all locations
      this.filteredLocations = [...this.parkingLocations];
    }

    this.isLoading = false;
  }

  resetSearch(): void {
    this.searchForm.reset();
    this.error = '';
    this.filteredLocations = [...this.parkingLocations];
  }

  toggleView(viewType: 'grid' | 'map') {
    this.view = viewType;
  }

  viewLocationDetails(location: ParkingLocation) {
    // Navigate to location details page
    this.router.navigate(['/parking-locations', location.id]);
  }

  // Handle legacy code for details modal (in case it's still used)
  showLocationDetailsModal(location: ParkingLocation) {
    this.selectedLocation = location;
    this.showDetails = true;
  }

  closeDetails() {
    this.showDetails = false;
  }

  bookParking(location: ParkingLocation) {
    if (this.isUserAuthenticated) {
      this.router.navigate(['/parking-locations', location.id, 'booking']);
    } else {
      if (confirm('Please login first to book parking. Click OK to go to login page.')) {
        // Save intended location in session storage for redirect after login
        const redirectUrl = `/parking-locations/${location.id}/booking`;
        sessionStorage.setItem('redirectAfterLogin', redirectUrl);
        this.router.navigate(['/login']);
      }
    }
  }

  getAvailabilityClass(location: ParkingLocation): string {
    if (!location || location.available_spots === undefined || location.total_spots === undefined || location.total_spots === 0) {
      return 'limited'; // Default to limited if data is missing
    }
    
    const availabilityPercentage = (location.available_spots / location.total_spots) * 100;
    if (availabilityPercentage > 50) {
      return 'available';
    } else if (availabilityPercentage > 20) {
      return 'limited';
    } else {
      return 'full';
    }
  }

  getAvailabilityText(location: ParkingLocation): string {
    if (!location || location.available_spots === undefined || location.total_spots === undefined || location.total_spots === 0) {
      return 'Status Unknown'; // Default text if data is missing
    }
    
    const availabilityPercentage = (location.available_spots / location.total_spots) * 100;
    if (availabilityPercentage > 50) {
      return 'Available';
    } else if (availabilityPercentage > 20) {
      return 'Limited';
    } else {
      return 'Almost Full';
    }
  }

  formatRating(rating: number): string {
    if (rating === undefined || rating === null) {
      return '0.0';
    }
    return rating.toFixed(1);
  }

  formatDate(date: string): string {
    const parsedDate = this.globalService.parseDate(date);
    return this.globalService.formatDate(parsedDate);
  }

  getTotalAvailableSlots(location: ParkingLocation): number {
    if (!location.slot_availabilities || !Array.isArray(location.slot_availabilities)) {
      return 0;
    }

    return location.slot_availabilities.reduce((total: number, slot: { available_slots: number }) => {
      return total + (slot.available_slots || 0);
    }, 0);
  }
} 