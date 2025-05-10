import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { AdminService, BookingListResponse } from '../../../services/admin.service';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    NgbModule, 
    NgbPaginationModule, 
    FormsModule, 
    ReactiveFormsModule
  ],
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.css']
})
export class BookingListComponent implements OnInit {
  bookings: any[] = [];
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
      status: ['']
    });
  }

  ngOnInit(): void {
    this.loadBookings();
    
    // Subscribe to filter form changes
    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage = 1; // Reset to first page when filters change
      this.loadBookings();
    });
  }

  loadBookings(): void {
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
    
    // Add status filter if selected
    const statusValue = this.filterForm.get('status')?.value;
    if (statusValue) {
      params.status = statusValue;
    }
    
    this.adminService.getBookings(params).subscribe({
      next: (response: BookingListResponse) => {
        this.bookings = response.bookings;
        this.totalItems = response.pagination.total;
        this.pageSize = response.pagination.per_page;
        this.currentPage = response.pagination.current_page;
        this.totalPages = response.pagination.last_page;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load bookings. Please try again.';
        console.error('Error loading bookings:', err);
        this.isLoading = false;
      }
    });
  }

  pageChanged(page: number): void {
    this.currentPage = page;
    this.loadBookings();
  }

  refreshData(): void {
    this.loadBookings();
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      search: '',
      status: ''
    });
    // The valueChanges subscription will trigger loadBookings()
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'upcoming':
        return 'bg-primary';
      case 'checked_in':
        return 'bg-success';
      case 'completed':
        return 'bg-info';
      case 'cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  }
} 