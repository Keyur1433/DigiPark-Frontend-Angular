import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import { NgbModalModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface BookingPagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

interface OwnerBookingsResponse {
  bookings: any[];
  pagination: BookingPagination;
}

@Component({
  selector: 'app-owner-bookings',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbModalModule, FormsModule],
  templateUrl: './owner-bookings.component.html',
  styleUrls: ['./owner-bookings.component.css']
})
export class OwnerBookingsComponent implements OnInit {
  userId: number | null = null;
  bookings: any[] = [];
  pagination: BookingPagination | null = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;
  statusFilter: string = 'all';
  searchTerm: string = '';
  currentPage: number = 1;
  
  // For booking details modal
  selectedBooking: any = null;
  isLoadingBookingDetails: boolean = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private modalService: NgbModal,
    private toastr: ToastrService
  ) {}
  
  ngOnInit(): void {
    // Try to get ID from route params first
    this.route.parent?.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.userId = +idParam;
        this.loadBookings();
      } else {
        // Fallback to currentUser
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.id) {
          this.userId = currentUser.id;
          this.loadBookings();
        } else {
          this.errorMessage = 'Unable to determine owner ID. Please log in again.';
          this.isLoading = false;
        }
      }
    });
  }
  
  loadBookings(page: number = 1): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    let apiUrl = `${environment.apiUrl}/owner/bookings?page=${page}`;
    
    // Add filters if set
    if (this.statusFilter && this.statusFilter !== 'all') {
      apiUrl += `&status=${this.statusFilter}`;
    }
    
    if (this.searchTerm) {
      apiUrl += `&search=${this.searchTerm}`;
    }
    
    this.http.get<OwnerBookingsResponse>(apiUrl)
      .pipe(
        catchError(error => {
          console.error('Error loading bookings:', error);
          this.errorMessage = 'Failed to load bookings. Please try again.';
          this.isLoading = false;
          return of({ 
            bookings: [], 
            pagination: {
              total: 0,
              per_page: 10,
              current_page: 1,
              last_page: 1
            } 
          } as OwnerBookingsResponse);
        })
      )
      .subscribe(response => {
        this.bookings = response.bookings;
        this.pagination = response.pagination;
        this.currentPage = page;
        this.isLoading = false;
      });
  }
  
  applyFilters(): void {
    this.loadBookings(1); // Reset to first page when applying filters
  }
  
  resetFilters(): void {
    this.statusFilter = 'all';
    this.searchTerm = '';
    this.loadBookings(1);
  }
  
  changePage(page: number): void {
    if (page !== this.currentPage) {
      this.loadBookings(page);
    }
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  }
  
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
      case 'checked_in':
        return 'bg-primary';
      case 'upcoming':
      case 'reserved':
      case 'pending':
        return 'bg-info';
      case 'completed':
      case 'checked_out':
        return 'bg-success';
      case 'cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }
  
  viewBookingDetails(booking: any, detailsModal: any): void {
    this.isLoadingBookingDetails = true;
    this.selectedBooking = null;
    
    // Open modal first for better UX
    const modalRef = this.modalService.open(detailsModal, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      scrollable: true
    });
    
    // Then load the data
    this.http.get(`${environment.apiUrl}/owner/bookings/${booking.id}`)
      .subscribe({
        next: (response: any) => {
          console.log('Booking details loaded:', response);
          this.selectedBooking = response.booking;
          this.isLoadingBookingDetails = false;
        },
        error: (error) => {
          console.error('Error loading booking details:', error);
          this.isLoadingBookingDetails = false;
          this.toastr.error('Failed to load booking details');
          modalRef.dismiss();
        }
      });
  }
  
  // Action handlers for booking status updates
  checkInBooking(bookingId: number): void {
    this.updateBookingStatus(bookingId, 'checked_in');
  }
  
  checkOutBooking(bookingId: number): void {
    this.updateBookingStatus(bookingId, 'completed');
  }
  
  cancelBooking(bookingId: number): void {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.updateBookingStatus(bookingId, 'cancelled');
    }
  }
  
  updateBookingStatus(bookingId: number, status: string): void {
    this.http.post(`${environment.apiUrl}/owner/bookings/${bookingId}/update-status`, { status })
      .subscribe({
        next: (response: any) => {
          this.toastr.success(response.message || 'Status updated successfully');
          
          // Update the selected booking if it's currently displayed
          if (this.selectedBooking && this.selectedBooking.id === bookingId) {
            this.http.get(`${environment.apiUrl}/owner/bookings/${bookingId}`)
              .subscribe({
                next: (response: any) => {
                  this.selectedBooking = response.booking;
                }
              });
          }
          
          // Refresh the bookings list
          this.loadBookings(this.currentPage);
        },
        error: (error) => {
          this.toastr.error(error.error?.message || 'Failed to update status');
        }
      });
  }
} 