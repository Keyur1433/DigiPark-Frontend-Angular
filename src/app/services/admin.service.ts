import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

export interface AdminDashboardResponse {
  statistics: {
    total_users: number;
    total_owners: number;
    total_parking_locations: number;
    total_bookings: number;
    active_bookings: number;
    completed_bookings: number;
    cancelled_bookings: number;
    total_revenue: number;
  };
  recent_bookings: any[];
}

export interface UserListResponse {
  users: any[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface UserDetailsResponse {
  user: any;
}

export interface BookingListResponse {
  bookings: any[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface LocationListResponse {
  parking_locations: any[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private http: HttpClient) { }

  getDashboard(): Observable<AdminDashboardResponse> {
    return this.http.get<AdminDashboardResponse>(`${API_URL}/admin/dashboard`);
  }

  getUsers(params?: any): Observable<UserListResponse> {
    return this.http.get<UserListResponse>(`${API_URL}/admin/users`, { params });
  }

  getUserDetails(userId: number): Observable<UserDetailsResponse> {
    return this.http.get<UserDetailsResponse>(`${API_URL}/admin/users/${userId}`);
  }

  getBookings(params?: any): Observable<BookingListResponse> {
    return this.http.get<BookingListResponse>(`${API_URL}/admin/bookings`, { params });
  }

  getParkingLocations(params?: any): Observable<LocationListResponse> {
    return this.http.get<LocationListResponse>(`${API_URL}/admin/parking-locations`, { params });
  }

  createUser(userData: any): Observable<any> {
    return this.http.post(`${API_URL}/admin/users`, userData);
  }

  updateUser(userId: number, userData: any): Observable<any> {
    return this.http.put(`${API_URL}/admin/users/${userId}`, userData);
  }

  toggleUserStatus(userId: number): Observable<any> {
    return this.http.post(`${API_URL}/admin/users/${userId}/toggle-status`, {});
  }
} 