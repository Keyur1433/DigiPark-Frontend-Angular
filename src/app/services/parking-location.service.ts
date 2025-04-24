import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ParkingLocationService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * Get all available parking locations
   */
  getParkingLocations(includeInactive: boolean = true): Observable<any> {
    console.log('Fetching parking locations from API...');
    // Add the include_inactive parameter to show all locations regardless of status
    const url = includeInactive 
      ? `${this.apiUrl}/parking-locations?include_inactive=true` 
      : `${this.apiUrl}/parking-locations`;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        console.log('Raw API response:', response);
        
        // If no locations found, log this for debugging
        if (response && response.parking_locations && response.parking_locations.length === 0) {
          console.log('API returned empty parking_locations array. This might be expected if no locations exist, or could indicate filtering is occurring on the server.');
        }
        
        return response;
      }),
      catchError(error => {
        console.error('Error getting parking locations:', error);
        // Log details about the error
        if (error.status === 0) {
          console.error('Backend server may not be running or CORS issue');
        } else if (error.status === 401) {
          console.error('Authentication required for this endpoint');
        } else if (error.status === 404) {
          console.error('API endpoint not found');
        }
        
        // Return mock data on error
        return of({
          parking_locations: [
            {
              id: 1,
              name: 'Downtown Parking',
              address: '123 Main St, Downtown, NY 10001',
              image_url: 'assets/images/parking1.jpg',
              total_spots: 50,
              available_spots: 18,
              hourly_rate: 5,
              is_active: true,
              rating: 4.5,
              features: ['CCTV', 'Security', 'Covered']
            },
            {
              id: 2,
              name: 'East Side Garage',
              address: '456 East Blvd, Eastside, NY 10002',
              image_url: 'assets/images/parking2.jpg',
              total_spots: 35,
              available_spots: 10,
              hourly_rate: 4,
              is_active: true,
              rating: 4.2,
              features: ['24/7 Access', 'Security', 'EV Charging']
            },
            {
              id: 3,
              name: 'North Station Lot',
              address: '789 North Ave, Northside, NY 10003',
              image_url: 'assets/images/parking3.jpg',
              total_spots: 60,
              available_spots: 32,
              hourly_rate: 6,
              is_active: true,
              rating: 4.7,
              features: ['Valet Parking', 'Car Wash', 'Covered']
            }
          ]
        });
      })
    );
  }

  /**
   * Search for parking locations by location name or address
   */
  searchParkingLocations(searchTerm: string): Observable<any> {
    console.log('Searching parking locations with term:', searchTerm);
    return this.http.get<any>(`${this.apiUrl}/parking-locations/search?query=${searchTerm}`).pipe(
      catchError(error => {
        console.error('Error searching parking locations:', error);
        
        // Return filtered mock data based on the search term
        const mockData = [
          {
            id: 1,
            name: 'Downtown Parking',
            address: '123 Main St, Downtown, NY 10001',
            image_url: 'assets/images/parking1.jpg',
            total_spots: 50,
            available_spots: 18,
            hourly_rate: 5,
            is_active: true,
            rating: 4.5,
            features: ['CCTV', 'Security', 'Covered']
          },
          {
            id: 2,
            name: 'East Side Garage',
            address: '456 East Blvd, Eastside, NY 10002',
            image_url: 'assets/images/parking2.jpg',
            total_spots: 35,
            available_spots: 10,
            hourly_rate: 4,
            is_active: true,
            rating: 4.2,
            features: ['24/7 Access', 'Security', 'EV Charging']
          },
          {
            id: 3,
            name: 'North Station Lot',
            address: '789 North Ave, Northside, NY 10003',
            image_url: 'assets/images/parking3.jpg',
            total_spots: 60,
            available_spots: 32,
            hourly_rate: 6,
            is_active: true,
            rating: 4.7,
            features: ['Valet Parking', 'Car Wash', 'Covered']
          }
        ];
        
        const lowercaseSearch = searchTerm.toLowerCase();
        return of(mockData.filter(location => 
          location.name.toLowerCase().includes(lowercaseSearch) || 
          location.address.toLowerCase().includes(lowercaseSearch)
        ));
      })
    );
  }

  /**
   * Get details for a specific parking location
   */
  getParkingLocationDetails(locationId: number): Observable<any> {
    console.log(`Fetching details for parking location ID: ${locationId}`);
    return this.http.get<any>(`${this.apiUrl}/parking-locations/${locationId}`).pipe(
      map(response => {
        console.log('Raw location details response:', response);
        
        // Check if the response has the expected structure
        if (response && response.parking_location) {
          // Map the API response to the format expected by the component
          const location = response.parking_location;
          
          // Calculate availability percentages for display
          let availableSpots = 0;
          let totalSpots = 0;
          
          if (location.slot_availabilities && location.slot_availabilities.length > 0) {
            // Sum up slots from all vehicle types
            location.slot_availabilities.forEach((slot: any) => {
              availableSpots += slot.available_slots;
              totalSpots += slot.total_slots;
            });
          } else {
            // Fallback to capacity values if slot_availabilities is not available
            availableSpots = location.two_wheeler_capacity + location.four_wheeler_capacity;
            totalSpots = location.two_wheeler_capacity + location.four_wheeler_capacity;
          }
          
          // Return a transformed object that matches the component's expectations
          return {
            id: location.id,
            name: location.name,
            address: location.address,
            city: location.city,
            state: location.state,
            country: location.country,
            description: location.description || 'No description available for this parking location.',
            image_url: location.image_url || 'assets/images/parking1.jpg',
            total_spots: totalSpots,
            available_spots: availableSpots,
            hourly_rate: location.four_wheeler_hourly_rate || 0,
            two_wheeler_price: location.two_wheeler_hourly_rate || 0,
            four_wheeler_price: location.four_wheeler_hourly_rate || 0,
            daily_rate: location.daily_rate || (location.four_wheeler_hourly_rate * 8),
            monthly_rate: location.monthly_rate || (location.four_wheeler_hourly_rate * 180),
            is_active: location.is_active,
            rating: location.rating || 4.5,
            amenities: location.amenities || ['Security', '24/7 Access', 'Covered Parking'],
            features: location.features || ['Secure', 'Central Location', 'Easy Access'],
            opening_time: location.opening_time || '06:00 AM',
            closing_time: location.closing_time || '11:00 PM',
            slot_availabilities: location.slot_availabilities || []
          };
        }
        
        // If response format is unexpected, just return the raw response
        return response;
      }),
      catchError(error => {
        console.error('Error getting parking location details:', error);
        // Return mock data on error
        return of({
          id: locationId,
          name: 'Downtown Parking',
          address: '123 Main St, Downtown, NY 10001',
          description: 'Centrally located parking with security and easy access',
          image_url: 'assets/images/parking1.jpg',
          total_spots: 50,
          available_spots: 18,
          hourly_rate: 5,
          daily_rate: 25,
          monthly_rate: 300,
          is_active: true,
          rating: 4.5,
          amenities: ['Security Cameras', 'Covered Parking', '24/7 Access'],
          features: ['CCTV', 'Security', 'Covered'],
          opening_time: '06:00 AM',
          closing_time: '11:00 PM'
        });
      })
    );
  }
} 