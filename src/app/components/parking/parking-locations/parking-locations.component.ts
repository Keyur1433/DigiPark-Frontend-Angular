import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbDatepickerModule, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { ParkingService, ParkingLocation } from '../../../services/parking.service';

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
  styleUrls: ['./parking-locations.component.css']
})
export class ParkingLocationsComponent implements OnInit {
  parkingLocations: ParkingLocation[] = [];
  filteredLocations: ParkingLocation[] = [];
  searchForm: FormGroup;
  isLoading = false;
  error = '';
  view = 'grid'; // 'grid' or 'map'
  selectedLocation: ParkingLocation | null = null;
  showDetails = false;

  constructor(
    private parkingService: ParkingService,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      location: [''],
      date: [''],
      fromTime: [''],
      toTime: ['']
    });
  }

  ngOnInit(): void {
    this.loadParkingLocations();
  }

  loadParkingLocations() {
    this.isLoading = true;
    this.error = '';
    
    this.parkingService.getParkingLocations().subscribe({
      next: (locations) => {
        this.parkingLocations = locations;
        this.filteredLocations = [...locations];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching parking locations', error);
        this.error = 'Failed to load parking locations. Please try again.';
        this.isLoading = false;
      }
    });
  }

  searchLocations() {
    if (this.searchForm.invalid) {
      return;
    }
    
    const searchCriteria = this.searchForm.value;
    
    if (searchCriteria.location && searchCriteria.location.trim() !== '') {
      this.isLoading = true;
      
      this.parkingService.searchParkingLocations(searchCriteria.location).subscribe({
        next: (locations) => {
          this.filteredLocations = locations;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error searching parking locations', error);
          this.error = 'Failed to search parking locations. Please try again.';
          this.isLoading = false;
        }
      });
    } else {
      // If no search term, show all locations
      this.filteredLocations = [...this.parkingLocations];
    }
  }

  resetSearch() {
    this.searchForm.reset();
    this.filteredLocations = [...this.parkingLocations];
  }

  toggleView(view: 'grid' | 'map') {
    this.view = view;
  }

  viewLocationDetails(location: ParkingLocation) {
    this.selectedLocation = location;
    this.showDetails = true;
  }

  closeDetails() {
    this.showDetails = false;
  }

  bookParking(location: ParkingLocation) {
    // In a real implementation, this would navigate to a booking form
    // or open a modal with the booking details
    console.log('Booking for location:', location);
  }

  formatRating(rating: number): string {
    return rating.toFixed(1);
  }

  getAvailabilityClass(location: ParkingLocation): string {
    const availabilityPercentage = (location.available_spots / location.total_spots) * 100;
    
    if (availabilityPercentage > 50) {
      return 'high-availability';
    } else if (availabilityPercentage > 20) {
      return 'medium-availability';
    } else {
      return 'low-availability';
    }
  }

  getAvailabilityText(location: ParkingLocation): string {
    const availabilityPercentage = (location.available_spots / location.total_spots) * 100;
    
    if (availabilityPercentage > 50) {
      return 'High Availability';
    } else if (availabilityPercentage > 20) {
      return 'Medium Availability';
    } else {
      return 'Low Availability';
    }
  }
} 