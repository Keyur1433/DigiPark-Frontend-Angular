import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AdminService, AdminDashboardResponse } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NgbModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  dashboardData: AdminDashboardResponse | null = null;
  isLoading = true;
  error = '';

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.adminService.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load dashboard data. Please try again.';
        this.isLoading = false;
        console.error('Dashboard data loading error:', err);
      }
    });
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  getBookingStatusClass(status: string): string {
    switch (status) {
      case 'upcoming':
        return 'text-primary';
      case 'checked_in':
        return 'text-success';
      case 'completed':
        return 'text-info';
      case 'cancelled':
        return 'text-danger';
      default:
        return '';
    }
  }
} 