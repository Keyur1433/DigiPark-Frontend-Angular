import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ParkingLocationService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * Get all available parking locations
   */
  getParkingLocations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/parking-locations`).pipe(
      catchError(error => {
        console.error('Error getting parking locations:', error);
        // Return mock data on error
        return of([
          {
            id: 1,
            name: 'Downtown Parking',
            address: '123 Main St, Downtown, NY 10001',
            image_url: 'assets/images/parking1.jpg',
            total_spots: 50,
            available_spots: 18,
            hourly_rate: 5,
            is_active: true
          },
          {
            id: 2,
            name: 'East Side Garage',
            address: '456 East Blvd, Eastside, NY 10002',
            image_url: 'assets/images/parking2.jpg',
            total_spots: 35,
            available_spots: 10,
            hourly_rate: 4,
            is_active: true
          },
          {
            id: 3,
            name: 'North Station Lot',
            address: '789 North Ave, Northside, NY 10003',
            image_url: 'assets/images/parking3.jpg',
            total_spots: 60,
            available_spots: 32,
            hourly_rate: 6,
            is_active: true
          }
        ]);
      })
    );
  }

  /**
   * Get details for a specific parking location
   */
  getParkingLocationDetails(locationId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/parking-locations/${locationId}`).pipe(
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
          amenities: ['Security Cameras', 'Covered Parking', '24/7 Access']
        });
      })
    );
  }
} 