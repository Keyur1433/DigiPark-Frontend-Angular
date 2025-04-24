import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces
export interface OwnerDashboardStats {
  total_parking_locations: number;
  active_parking_locations: number;
  total_two_wheeler_capacity: number;
  total_four_wheeler_capacity: number;
  total_bookings: number;
  active_bookings: number;
  completed_bookings: number;
  total_revenue: number;
  today_revenue: number;
}

export interface Vehicle {
  id: number;
  type: string;
  number_plate: string;
  brand: string;
  model: string;
  color: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
}

export interface ParkingLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  two_wheeler_capacity: number;
  four_wheeler_capacity: number;
  two_wheeler_price_per_hour: number;
  four_wheeler_price_per_hour: number;
  // Additional possible field names for pricing
  two_wheeler_hourly_rate?: number;
  four_wheeler_hourly_rate?: number;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: number;
  user: User;
  vehicle: Vehicle;
  parking_location: ParkingLocation;
  check_in_time: string;
  check_out_time: string;
  status: 'upcoming' | 'checked_in' | 'completed' | 'cancelled';
  booking_type: 'check_in' | 'advance';
  amount: number;
  payment_status: string;
  created_at: string;
}

export interface DashboardData {
  statistics: OwnerDashboardStats;
  recent_bookings: Booking[];
}

export interface BookingsResponse {
  bookings: Booking[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface ParkingLocationsResponse {
  parking_locations: ParkingLocation[];
}

export interface ParkingLocationDetailResponse {
  parking_location: ParkingLocation;
  today_bookings: Booking[];
  revenue: {
    today: number;
    this_week: number;
    this_month: number;
  };
}

export interface ParkingLocationCreate {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  latitude: number;
  longitude: number;
  two_wheeler_capacity: number;
  four_wheeler_capacity: number;
  two_wheeler_hourly_rate: number;
  four_wheeler_hourly_rate: number;
}

@Injectable({
  providedIn: 'root'
})
export class OwnerService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Get dashboard data for owner
  getDashboardData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}/owner/dashboard`);
  }

  // Get all bookings for owner's parking locations
  getBookings(params: any = {}): Observable<BookingsResponse> {
    return this.http.get<BookingsResponse>(`${this.apiUrl}/owner/bookings`, { params });
  }

  // Get all parking locations owned by the authenticated owner
  getParkingLocations(params: any = {}): Observable<ParkingLocationsResponse> {
    return this.http.get<ParkingLocationsResponse>(`${this.apiUrl}/owner/parking-locations`, { params });
  }

  // Get details of a specific parking location
  getParkingLocationDetails(id: number): Observable<ParkingLocationDetailResponse> {
    return this.http.get<ParkingLocationDetailResponse>(`${this.apiUrl}/owner/parking-locations/${id}`);
  }

  // Get booking details for a specific booking
  getBookingDetails(id: number): Observable<{ booking: Booking }> {
    return this.http.get<{ booking: Booking }>(`${this.apiUrl}/owner/bookings/${id}`);
  }

  // Update check-in status for a booking
  checkInBooking(id: number, qrCode: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/owner/bookings/${id}/check-in`, { qr_code: qrCode });
  }

  // Update check-out status for a booking
  checkOutBooking(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/owner/bookings/${id}/check-out`, {});
  }

  // Create a new parking location
  createParkingLocation(locationData: ParkingLocationCreate): Observable<ParkingLocation> {
    return this.http.post<ParkingLocation>(`${this.apiUrl}/parking-locations`, locationData);
  }

  // Update an existing parking location
  updateParkingLocation(id: number, locationData: ParkingLocationCreate): Observable<ParkingLocation> {
    return this.http.put<ParkingLocation>(`${this.apiUrl}/parking-locations/${id}`, locationData);
  }

  // Toggle status of a parking location (active/inactive)
  toggleParkingLocationStatus(id: number): Observable<ParkingLocation> {
    return this.http.post<ParkingLocation>(`${this.apiUrl}/parking-locations/${id}/toggle-status`, {});
  }

  // Delete a parking location
  deleteParkingLocation(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/parking-locations/${id}`);
  }
} 