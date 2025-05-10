import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { NgbModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { AdminService, UserListResponse } from '../../../services/admin.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    NgbModule, 
    NgbPaginationModule, 
    FormsModule, 
    ReactiveFormsModule
  ],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: any[] = [];
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
      role: ['']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    
    // Subscribe to filter form changes
    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage = 1; // Reset to first page when filters change
      this.loadUsers();
    });
  }

  loadUsers(): void {
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
    
    // Add role filter if selected
    const roleValue = this.filterForm.get('role')?.value;
    if (roleValue) {
      params.role = roleValue;
    }
    
    this.adminService.getUsers(params).subscribe({
      next: (response: UserListResponse) => {
        this.users = response.users;
        this.totalItems = response.pagination.total;
        this.pageSize = response.pagination.per_page;
        this.currentPage = response.pagination.current_page;
        this.totalPages = response.pagination.last_page;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users. Please try again.';
        console.error('Error loading users:', err);
        this.isLoading = false;
      }
    });
  }

  pageChanged(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  refreshData(): void {
    this.loadUsers();
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      search: '',
      role: ''
    });
    // The valueChanges subscription will trigger loadUsers()
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin':
        return 'bg-danger';
      case 'owner':
        return 'bg-success';
      case 'user':
        return 'bg-primary';
      default:
        return 'bg-secondary';
    }
  }
} 