import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface ParkingLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  total_spots: number;
  available_spots: number;
  hourly_rate: number;
  daily_rate: number;
  description: string;
  features: string[];
  image_url: string;
  rating: number;
  opening_time: string;
  closing_time: string;
}

export interface BookingRequest {
  parking_location_id: number;
  vehicle_id: number;
  start_time: string;
  end_time: string;
  payment_method_id?: number;
}

export interface Booking {
  id: number;
  parking_location: ParkingLocation;
  vehicle_id: number;
  vehicle_number: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  amount: number;
  created_at: string;
  updated_at: string;
}

const API_URL = 'http://127.0.0.1:8000/api';

@Injectable({
  providedIn: 'root'
})
export class ParkingService {
  
  constructor(private http: HttpClient) { }
  
  // Get all parking locations
  getParkingLocations(): Observable<ParkingLocation[]> {
    return this.http.get<ParkingLocation[]>(`${API_URL}/parking-locations`).pipe(
      catchError(error => {
        console.error('Error fetching parking locations', error);
        // Return dummy data in case of error
        return of(this.getDummyLocations());
      })
    );
  }
  
  // Get a single parking location by ID
  getParkingLocation(id: number): Observable<ParkingLocation> {
    return this.http.get<ParkingLocation>(`${API_URL}/parking-locations/${id}`).pipe(
      catchError(error => {
        console.error(`Error fetching parking location with ID ${id}`, error);
        // Return first dummy location in case of error
        return of(this.getDummyLocations()[0]);
      })
    );
  }
  
  // Search parking locations
  searchParkingLocations(query: string): Observable<ParkingLocation[]> {
    return this.http.get<ParkingLocation[]>(`${API_URL}/parking-locations/search?query=${query}`).pipe(
      catchError(error => {
        console.error('Error searching parking locations', error);
        // Return filtered dummy data in case of error
        return of(this.getDummyLocations().filter(location => 
          location.name.toLowerCase().includes(query.toLowerCase()) ||
          location.address.toLowerCase().includes(query.toLowerCase()) ||
          location.city.toLowerCase().includes(query.toLowerCase())
        ));
      })
    );
  }
  
  // Create a booking
  createBooking(bookingData: BookingRequest): Observable<Booking> {
    return this.http.post<Booking>(`${API_URL}/bookings`, bookingData);
  }
  
  // Get user's bookings
  getUserBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${API_URL}/bookings`);
  }
  
  // Cancel a booking
  cancelBooking(bookingId: number): Observable<any> {
    return this.http.put<any>(`${API_URL}/bookings/${bookingId}/cancel`, {});
  }
  
  // Dummy data for fallback
  private getDummyLocations(): ParkingLocation[] {
    return [
      {
        id: 1,
        name: 'Central City Parking',
        address: '123 Main Street',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        latitude: 23.0225,
        longitude: 72.5714,
        total_spots: 200,
        available_spots: 45,
        hourly_rate: 30,
        daily_rate: 150,
        description: 'Conveniently located in the heart of the city with 24/7 security surveillance.',
        features: ['CCTV', 'Security Personnel', 'Covered Parking', 'EV Charging'],
        image_url: 'https://images.unsplash.com/photo-1611288891449-50b783011feb?q=80&w=1200',
        rating: 4.5,
        opening_time: '00:00',
        closing_time: '23:59'
      },
      {
        id: 2,
        name: 'Mall of India Parking',
        address: '456 Shopping Avenue',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        latitude: 23.0469,
        longitude: 72.5316,
        total_spots: 500,
        available_spots: 120,
        hourly_rate: 40,
        daily_rate: 200,
        description: 'Spacious parking area with easy access to the largest shopping mall in the region.',
        features: ['CCTV', 'Valet Parking', 'Car Wash', 'Wheelchair Accessibility'],
        image_url: 'https://images.unsplash.com/photo-1593348596808-84ad2fc6de4f?q=80&w=1200',
        rating: 4.2,
        opening_time: '09:00',
        closing_time: '22:00'
      },
      {
        id: 3,
        name: 'Airport Secure Parking',
        address: '789 Airport Road',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        latitude: 23.0707,
        longitude: 72.6345,
        total_spots: 300,
        available_spots: 85,
        hourly_rate: 50,
        daily_rate: 300,
        description: 'Safe and secure parking solution for air travelers with shuttle service to terminals.',
        features: ['24/7 Security', 'Shuttle Service', 'Luggage Assistance', 'Covered Parking'],
        image_url: 'https://images.unsplash.com/photo-1608507074822-bdfaab6144a1?q=80&w=1200',
        rating: 4.7,
        opening_time: '00:00',
        closing_time: '23:59'
      },
      {
        id: 4,
        name: 'Business District Parking',
        address: '101 Corporate Park',
        city: 'Gandhinagar',
        state: 'Gujarat',
        country: 'India',
        latitude: 23.2156,
        longitude: 72.6369,
        total_spots: 150,
        available_spots: 32,
        hourly_rate: 35,
        daily_rate: 180,
        description: 'Premium parking facility in the business district with enhanced security features.',
        features: ['VIP Parking', 'Car Detailing', 'EV Charging', 'CCTV'],
        image_url: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?q=80&w=1200',
        rating: 4.3,
        opening_time: '06:00',
        closing_time: '22:00'
      },
      {
        id: 5,
        name: 'Stadium Parking Complex',
        address: '555 Sports Boulevard',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        latitude: 23.0920,
        longitude: 72.5956,
        total_spots: 400,
        available_spots: 200,
        hourly_rate: 25,
        daily_rate: 120,
        description: 'Expansive parking area near the stadium with special rates during sports events.',
        features: ['Event Parking', 'Food Kiosks', 'Restrooms', 'First Aid'],
        image_url: 'https://images.unsplash.com/photo-1609618556624-bda0d7fbe6ac?q=80&w=1200',
        rating: 4.0,
        opening_time: '08:00',
        closing_time: '23:00'
      }
    ];
  }
} 