import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, retry, tap, timeout } from 'rxjs/operators';

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
  // Additional fields from owner service
  two_wheeler_capacity?: number;
  four_wheeler_capacity?: number;
  two_wheeler_price_per_hour?: number;
  four_wheeler_price_per_hour?: number;
  two_wheeler_hourly_rate?: number;
  four_wheeler_hourly_rate?: number;
  is_active?: boolean;
  // Fields from parking locations API
  slot_availabilities?: Array<{
    vehicle_type: string;
    available_slots: number;
    total_slots: number;
  }>;
  // Fallback fields for different data sources
  available_spaces?: number;
  capacity?: number;
  occupied_spaces?: number;
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

// Based on user's API routes file, we know the endpoint is /parking-locations
const LARAVEL_API_URLS = [
  'http://127.0.0.1:8000/api/parking-locations',
  'http://localhost:8000/api/parking-locations',
  'http://localhost/api/parking-locations'
];

@Injectable({
  providedIn: 'root'
})
export class ParkingService {
  
  constructor(private http: HttpClient) {
    console.log('ParkingService initialized with Laravel API URLs:', LARAVEL_API_URLS);
    
    // Test the confirmed endpoint with different base URLs
    this.testApiConnections();
  }
  
  // Set up headers to handle CORS and content type
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
  }
  
  // Test all possible API URLs to find the correct one
  private testApiConnections(): void {
    LARAVEL_API_URLS.forEach(url => {
      console.log(`Testing API connection to: ${url}`);
      
      const options = {
        headers: this.getHeaders(),
        responseType: 'text' as 'text'
      };
      
      this.http.get(url, options).pipe(
        timeout(5000),
        catchError(error => {
          console.warn(`API connection to ${url} failed:`, error.message);
          return of(null);
        })
      ).subscribe(response => {
        if (response) {
          console.log(`✅ API connection to ${url} successful!`);
          console.log('Raw response (first 100 chars):', response.substring(0, 100));
          // Try to parse and log data structure
          try {
            const parsed = JSON.parse(response);
            console.log('Parsed response structure:', Object.keys(parsed));
            if (parsed.data) {
              console.log('Data exists with length:', Array.isArray(parsed.data) ? parsed.data.length : 'not an array');
            }
          } catch (e) {
            console.warn('Could not parse response as JSON');
          }
        }
      });
    });
  }
  
  // Get all parking locations with proper headers
  getParkingLocations(): Observable<ParkingLocation[]> {
    console.log('Attempting to fetch parking locations from Laravel backend...');
    
    const options = {
      headers: this.getHeaders()
    };
    
    // Try the URLs in sequence
    return this.tryNextUrl(LARAVEL_API_URLS, 0, options);
  }
  
  // Get a specific parking location by ID
  getParkingLocation(id: number): Observable<ParkingLocation> {
    console.log(`Attempting to fetch parking location with ID ${id}...`);
    
    const options = {
      headers: this.getHeaders()
    };
    
    // Try the URLs in sequence
    return this.tryNextUrlForSingleLocation(LARAVEL_API_URLS.map(url => `${url}/${id}`), 0, options);
  }
  
  // Helper to try URLs in sequence for a single location
  private tryNextUrlForSingleLocation(urls: string[], index: number, options: any): Observable<ParkingLocation> {
    if (index >= urls.length) {
      console.error('All Laravel API URLs failed for single location, using mock data');
      const mockLocations = this.getDummyLocations();
      const mockLocation = mockLocations.find(loc => loc.id === parseInt(urls[0].split('/').pop() || '0'));
      
      if (mockLocation) {
        return of(mockLocation);
      }
      return throwError(() => new Error('Parking location not found'));
    }
    
    const url = urls[index];
    console.log(`Trying to fetch single parking location from: ${url}`);
    
    return this.http.get<any>(url, options).pipe(
      timeout(10000), // 10 second timeout
      tap(response => {
        console.log(`Got response from ${url}:`, response);
      }),
      map((response: any) => {
        if (response && response.parking_location) {
          return response.parking_location;
        } else if (response && response.data) {
          return response.data;
        }
        return response;
      }),
      catchError(error => {
        console.error(`Error fetching from ${url}:`, error.message);
        
        if (error.status === 0) {
          console.error('CORS issue likely - server not allowing cross-origin requests');
        } else if (error.status === 401) {
          console.error('Authentication required - API needs credentials');
        } else if (error.status === 404) {
          console.error('Parking location not found');
        }
        
        // Try the next URL
        return this.tryNextUrlForSingleLocation(urls, index + 1, options);
      })
    );
  }
  
  // Helper to try URLs in sequence with proper options
  private tryNextUrl(urls: string[], index: number, options: any): Observable<ParkingLocation[]> {
    if (index >= urls.length) {
      console.error('All Laravel API URLs failed, using mock data');
      return of(this.getDummyLocations());
    }
    
    const url = urls[index];
    console.log(`Trying to fetch parking locations from: ${url}`);
    
    return this.http.get<any>(url, options).pipe(
      timeout(10000), // 10 second timeout
      tap(response => {
        console.log(`Got response from ${url}:`, response);
      }),
      map(response => this.extractLocationsFromResponse(response)),
      catchError(error => {
        console.error(`Error fetching from ${url}:`, error.message);
        
        if (error.status === 0) {
          console.error('CORS issue likely - server not allowing cross-origin requests');
        } else if (error.status === 401) {
          console.error('Authentication required - API needs credentials');
        }
        
        // Try the next URL
        return this.tryNextUrl(urls, index + 1, options);
      })
    );
  }
  
  // Search parking locations
  searchParkingLocations(queryParams: any): Observable<ParkingLocation[]> {
    console.log('Search params:', queryParams);
    
    const options: { headers: HttpHeaders, params?: HttpParams } = {
      headers: this.getHeaders()
    };
    
    // If queryParams is a string, treat it as a search term
    if (typeof queryParams === 'string') {
      const searchTerm = queryParams;
      console.log(`Searching for locations with term: "${searchTerm}"`);
      
      // Create HttpParams object
      let params = new HttpParams().set('query', searchTerm);
      
      // Add params to options
      options.params = params;
      
      // Try the URLs in sequence
      return this.tryNextUrl(LARAVEL_API_URLS.map(url => url + '/search'), 0, options)
        .pipe(
          catchError(error => {
            console.error('Search failed on all URLs, using filtered mock data');
            // Return filtered dummy data in case of error
            return of(this.getDummyLocations().filter(location => 
              location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
              location.city.toLowerCase().includes(searchTerm.toLowerCase())
            ));
          })
        );
    } 
    // If queryParams is an object, use it to create search parameters
    else {
      console.log('Searching with parameters:', queryParams);
      
      // Convert object to HttpParams
      let params = new HttpParams();
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] !== null && queryParams[key] !== undefined && queryParams[key] !== '') {
          params = params.set(key, queryParams[key]);
        }
      });
      
      // Add params to options
      options.params = params;
      
      // Try all URLs with parameters
      return this.tryNextUrl(LARAVEL_API_URLS, 0, options)
        .pipe(
          catchError(error => {
            console.error('Parametrized search failed on all URLs, using mock data');
            return of(this.getDummyLocations());
          })
        );
    }
  }
  
  // Helper method to extract locations from different response formats
  private extractLocationsFromResponse(response: any): ParkingLocation[] {
    if (response && response.data && Array.isArray(response.data)) {
      console.log('Found data array in response.data with', response.data.length, 'items');
      return response.data;
    } else if (response && response.parking_locations && Array.isArray(response.parking_locations)) {
      console.log('Found parking_locations array with', response.parking_locations.length, 'items');
      return response.parking_locations;
    } else if (Array.isArray(response)) {
      console.log('Response is already an array with', response.length, 'items');
      return response;
    }
    // If response format is not as expected, return empty array
    console.warn('Unexpected response format:', response);
    return [];
  }
  
  // Create a booking
  createBooking(bookingData: BookingRequest): Observable<Booking> {
    const options = {
      headers: this.getHeaders()
    };
    
    return this.http.post<Booking>(`${LARAVEL_API_URLS[0].replace('/parking-locations', '')}/bookings`, bookingData, options);
  }
  
  // Get user's bookings
  getUserBookings(): Observable<Booking[]> {
    const options = {
      headers: this.getHeaders()
    };
    
    return this.http.get<Booking[]>(`${LARAVEL_API_URLS[0].replace('/parking-locations', '')}/bookings`, options);
  }
  
  // Cancel a booking
  cancelBooking(bookingId: number): Observable<any> {
    const options = {
      headers: this.getHeaders()
    };
    
    return this.http.put<any>(`${LARAVEL_API_URLS[0].replace('/parking-locations', '')}/bookings/${bookingId}/cancel`, {}, options);
  }
  
  // Dummy data for fallback
  public getDummyLocations(): ParkingLocation[] {
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