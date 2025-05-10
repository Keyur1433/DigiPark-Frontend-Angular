import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { AdminService, LocationListResponse } from '../../../services/admin.service';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    NgbModule, 
    NgbPaginationModule, 
    FormsModule, 
    ReactiveFormsModule
  ],
  templateUrl: './location-list.component.html',
  styleUrls: ['./location-list.component.css']
})
export class LocationListComponent implements OnInit {
  parkingLocations: any[] = [];
  isLoading = true;
  error = '';
  filterForm: FormGroup;
  
  // Pagination
  currentPage = 1;
  totalItems = 0;
  pageSize = 15;
  totalPages = 0;

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      city: ['']
    });
  }

  ngOnInit(): void {
    this.loadParkingLocations();
    
    // Subscribe to filter form changes
    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage = 1; // Reset to first page when filters change
      this.loadParkingLocations();
    });
  }

  loadParkingLocations(): void {
    this.isLoading = true;
    
    // Prepare filter params
    const params: any = {
      page: this.currentPage
    };
    
    // Add search query if not empty
    const searchValue = this.filterForm.get('search')?.value;
    if (searchValue) {
      params.search = searchValue;
    }
    
    // Add city filter if selected
    const cityValue = this.filterForm.get('city')?.value;
    if (cityValue) {
      params.city = cityValue;
    }
    
    this.adminService.getParkingLocations(params).subscribe({
      next: (response: LocationListResponse) => {
        this.parkingLocations = response.parking_locations;
        this.totalItems = response.pagination.total;
        this.pageSize = response.pagination.per_page;
        this.currentPage = response.pagination.current_page;
        this.totalPages = response.pagination.last_page;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load parking locations. Please try again.';
        console.error('Error loading parking locations:', err);
        this.isLoading = false;
      }
    });
  }

  pageChanged(page: number): void {
    this.currentPage = page;
    this.loadParkingLocations();
  }

  refreshData(): void {
    this.loadParkingLocations();
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      search: '',
      city: ''
    });
    // The valueChanges subscription will trigger loadParkingLocations()
  }

  getAvailabilityBadgeClass(availability: number): string {
    if (availability > 10) {
      return 'bg-success';
    } else if (availability > 0) {
      return 'bg-warning';
    } else {
      return 'bg-danger';
    }
  }
} 