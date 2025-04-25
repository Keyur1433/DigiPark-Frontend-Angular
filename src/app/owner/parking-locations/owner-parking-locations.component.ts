import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../services/auth.service';
import { OwnerService, ParkingLocation, ParkingLocationDetailResponse } from '../../services/owner.service';

@Component({
  selector: 'app-owner-parking-locations',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbModalModule, DatePipe],
  templateUrl: './owner-parking-locations.component.html',
  styleUrls: ['./owner-parking-locations.component.css']
})
export class OwnerParkingLocationsComponent implements OnInit {
  userId: number | null = null;
  parkingLocations: ParkingLocation[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';
  selectedLocation: ParkingLocation | null = null;
  locationDetails: ParkingLocationDetailResponse | null = null;
  isLoadingDetails = false;

  @ViewChild('deactivatePromptModal') deactivatePromptModal: any;
  @ViewChild('deleteConfirmModal') deleteConfirmModal: any;
  @ViewChild('locationDetailsModal') locationDetailsModal: any;
  @ViewChild('activeLocationWarningModal') activeLocationWarningModal: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private ownerService: OwnerService,
    private modalService: NgbModal
  ) { }

  ngOnInit(): void {
    // Try to get ID from route params first
    this.route.parent?.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.userId = +idParam;
      } else {
        // Fallback to currentUser
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.id) {
          this.userId = currentUser.id;
        }
      }

      // Load parking locations after getting user ID
      this.loadParkingLocations();
    });
  }

  loadParkingLocations(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.ownerService.getParkingLocations().subscribe({
      next: (response) => {
        this.parkingLocations = response.parking_locations;

        // Check all possible price fields and ensure they're properly set
        this.parkingLocations = this.parkingLocations.map(location => {
          // Check different possible property names for pricing
          const twoWheelerPrice = Number(
            location.two_wheeler_price_per_hour ||
            location.two_wheeler_hourly_rate ||
            0
          );

          const fourWheelerPrice = Number(
            location.four_wheeler_price_per_hour ||
            location.four_wheeler_hourly_rate ||
            0
          );

          return {
            ...location,
            two_wheeler_price_per_hour: twoWheelerPrice,
            four_wheeler_price_per_hour: fourWheelerPrice
          };
        });

        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Failed to load parking locations. Please try again.';
        }
      }
    });
  }

  toggleLocationStatus(location: ParkingLocation): void {
    this.ownerService.toggleParkingLocationStatus(location.id).subscribe({
      next: (updatedLocation) => {
        // Find and update the location in the array
        const index = this.parkingLocations.findIndex(loc => loc.id === location.id);
        if (index !== -1) {
          this.parkingLocations[index].is_active = !this.parkingLocations[index].is_active;

          this.successMessage = `Location "${location.name}" has been ${this.parkingLocations[index].is_active ? 'activated' : 'deactivated'}.`;

          // Auto-dismiss success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        }
      },
      error: (error) => {
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Failed to update location status. Please try again.';
        }
      }
    });
  }

  editLocation(location: ParkingLocation): void {
    if (location.is_active) {
      // If location is active, show warning modal
      this.selectedLocation = location;
      this.modalService.open(this.deactivatePromptModal);
    } else {
      // If location is inactive, proceed to edit page
      this.router.navigate(['/owner', this.userId, 'parking-locations', 'edit', location.id]);
    }
  }

  viewLocationDetails(location: ParkingLocation): void {
    this.selectedLocation = location;
    this.isLoadingDetails = true;
    this.locationDetails = null;

    // Open the modal first so user sees loading indicator
    const modalRef = this.modalService.open(this.locationDetailsModal, { size: 'lg' });

    // Load location details
    this.ownerService.getParkingLocationDetails(location.id).subscribe({
      next: (details) => {
        // Get the actual pricing values from our already loaded location object
        // These values were already fixed in the loadParkingLocations method
        const actualTwoWheelerPrice = location.two_wheeler_price_per_hour;
        const actualFourWheelerPrice = location.four_wheeler_price_per_hour;

        // Ensure we use the actual pricing values for display
        this.locationDetails = {
          ...details,
          parking_location: {
            ...details.parking_location,
            two_wheeler_price_per_hour: actualTwoWheelerPrice,
            four_wheeler_price_per_hour: actualFourWheelerPrice
          }
        };
        this.isLoadingDetails = false;
      },
      error: (error) => {
        this.isLoadingDetails = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Failed to load location details. Please try again.';
        }
      }
    });
  }

  deleteLocation(location: ParkingLocation): void {
    if (location.is_active) {
      // If location is active, show warning modal
      this.selectedLocation = location;
      this.modalService.open(this.activeLocationWarningModal);
    } else {
      // If location is inactive, show confirmation modal
      this.selectedLocation = location;
      this.modalService.open(this.deleteConfirmModal);
    }
  }

  confirmDelete(): void {
    if (this.selectedLocation) {
      this.ownerService.deleteParkingLocation(this.selectedLocation.id).subscribe({
        next: () => {
          // Store name before filtering out the location
          const locationName = this.selectedLocation?.name || 'Location';

          // Remove the location from the array
          this.parkingLocations = this.parkingLocations.filter(
            loc => loc.id !== this.selectedLocation?.id
          );

          this.successMessage = `Location "${locationName}" has been deleted.`;

          // Auto-dismiss success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);

          // Close any open modals
          this.modalService.dismissAll();
        },
        error: (error: any) => {
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'Failed to delete location. Please try again.';
          }
          this.modalService.dismissAll();
        }
      });
    }
  }

  deactivateAndEdit(): void {
    if (this.selectedLocation) {
      this.ownerService.toggleParkingLocationStatus(this.selectedLocation.id).subscribe({
        next: () => {
          const locationId = this.selectedLocation?.id;

          // Update location status in the array
          if (this.selectedLocation) {
            const index = this.parkingLocations.findIndex(loc => loc.id === this.selectedLocation?.id);
            if (index !== -1) {
              this.parkingLocations[index].is_active = false;
            }
          }

          // Close modal
          this.modalService.dismissAll();

          // Navigate to edit page
          if (locationId && this.userId) {
            this.router.navigate(['/owner', this.userId, 'parking-locations', 'edit', locationId]);
          }
        },
        error: (error) => {
          this.modalService.dismissAll();
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'Failed to deactivate location. Please try again.';
          }
        }
      });
    }
  }

  deactivateAndDelete(): void {
    if (this.selectedLocation) {
      this.ownerService.toggleParkingLocationStatus(this.selectedLocation.id).subscribe({
        next: () => {
          // Update location status in the array
          if (this.selectedLocation) {
            const index = this.parkingLocations.findIndex(loc => loc.id === this.selectedLocation?.id);
            if (index !== -1) {
              this.parkingLocations[index].is_active = false;
            }

            // Close warning modal
            this.modalService.dismissAll();

            // Show delete confirmation modal
            this.modalService.open(this.deleteConfirmModal);
          }
        },
        error: (error) => {
          this.modalService.dismissAll();
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'Failed to deactivate location. Please try again.';
          }
        }
      });
    }
  }

  deactivateLocationOnly(): void {
    if (this.selectedLocation) {
      this.ownerService.toggleParkingLocationStatus(this.selectedLocation.id).subscribe({
        next: () => {
          // Update location status in the array
          const index = this.parkingLocations.findIndex(loc => loc.id === this.selectedLocation?.id);
          if (index !== -1) {
            this.parkingLocations[index].is_active = false;

            this.successMessage = `Location "${this.parkingLocations[index].name}" has been deactivated.`;

            // Auto-dismiss success message after 3 seconds
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          }

          // Close modal
          this.modalService.dismissAll();
        },
        error: (error) => {
          this.modalService.dismissAll();
          if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'Failed to deactivate location. Please try again.';
          }
        }
      });
    }
  }

  formatRating(rating: number): string {
    // Implementation of formatRating method
    return ''; // Placeholder return, actual implementation needed
  }
} 