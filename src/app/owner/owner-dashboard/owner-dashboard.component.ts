import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { NgbModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OwnerService, DashboardData, Booking } from '../../services/owner.service';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbModule],
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.css']
})
export class OwnerDashboardComponent implements OnInit {
  dashboardData: DashboardData | null = null;
  isLoading = true;
  error = '';
  currentDate = new Date().toLocaleDateString();
  userId: number | null = null;
  
  // For booking details modal
  selectedBooking: any = null;
  isLoadingBookingDetails = false;
  
  constructor(
    private ownerService: OwnerService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private modalService: NgbModal,
    private http: HttpClient,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    // Get user ID from route params
    this.route.parent?.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.userId = +idParam;
        console.log('User ID from route:', this.userId);
      } else {
        // Fallback to current user if not in route
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.id) {
          this.userId = currentUser.id;
          console.log('User ID from auth service:', this.userId);
        }
      }
      
      // Load dashboard data once we have a user ID
      this.loadDashboardData();
    });
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.error = '';
    
    this.ownerService.getDashboardData().subscribe({
      next: (data) => {
        console.log('Owner dashboard data:', data);
        this.dashboardData = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching dashboard data', err);
        if (err.error && err.error.message) {
          this.error = `API Error: ${err.error.message}`;
        } else if (err.status) {
          this.error = `Failed to load dashboard data. Server returned status ${err.status}. Please try again.`;
        } else {
          this.error = 'Failed to load dashboard data. Please try again.';
        }
        this.isLoading = false;
      }
    });
  }

  openBookingDetails(bookingId: number, modalRef: any) {
    this.isLoadingBookingDetails = true;
    this.selectedBooking = null;
    
    // Open the modal
    const modalInstance = this.modalService.open(modalRef, { 
      centered: true, 
      size: 'lg', 
      backdrop: 'static',
      scrollable: true
    });

    // Load booking details
    this.http.get(`${environment.apiUrl}/owner/bookings/${bookingId}`)
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
          modalInstance.dismiss();
        }
      });
  }

  updateBookingStatus(bookingId: number, status: string): void {
    this.http.post(`${environment.apiUrl}/owner/bookings/${bookingId}/update-status`, { status })
      .subscribe({
        next: (response: any) => {
          this.toastr.success(response.message || 'Status updated successfully');
          // Refresh booking details
          this.http.get(`${environment.apiUrl}/owner/bookings/${bookingId}`)
            .subscribe({
              next: (response: any) => {
                this.selectedBooking = response.booking;
              }
            });
          // Refresh dashboard data to update statistics
          this.loadDashboardData();
        },
        error: (error) => {
          this.toastr.error(error.error?.message || 'Failed to update status');
        }
      });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'upcoming':
        return 'bg-warning';
      case 'checked_in':
        return 'bg-primary';
      case 'completed':
        return 'bg-success';
      case 'cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  }
} 