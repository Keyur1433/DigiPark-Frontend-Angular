import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Vehicle {
  id: number;
  type: string;
  number_plate: string;
  brand: string;
  model: string;
  color: string;
}

const API_URL = 'http://127.0.0.1:8000/api';

@Injectable({
  providedIn: 'root'
})
export class VehicleService {

  constructor(private http: HttpClient) { }

  // Get all vehicles for the current user
  getUserVehicles(): Observable<Vehicle[]> {
    console.log('Fetching user vehicles...');
    return this.http.get<any>(`${API_URL}/vehicles`).pipe(
      map(response => {
        console.log('API response for vehicles:', response);
        // If the API returns a 'vehicles' array in the response, use that
        if (response && response.vehicles) {
          return response.vehicles;
        }
        // Otherwise, if the response itself is an array, return it
        if (Array.isArray(response)) {
          return response;
        }
        // Fallback to empty array if no valid response format is found
        console.warn('Unexpected API response format for vehicles', response);
        return [];
      }),
      catchError(error => {
        console.error('Error fetching user vehicles', error);
        // Return dummy data in case of error
        return of(this.getDummyVehicles());
      })
    );
  }

  // Get a single vehicle by ID
  getVehicle(id: number): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${API_URL}/vehicles/${id}`).pipe(
      catchError(error => {
        console.error(`Error fetching vehicle with ID ${id}`, error);
        // Return first dummy vehicle in case of error
        return of(this.getDummyVehicles()[0]);
      })
    );
  }

  // Create a new vehicle
  createVehicle(vehicleData: Omit<Vehicle, 'id'>): Observable<Vehicle> {
    console.log('Creating vehicle with data:', vehicleData);
    return this.http.post<Vehicle>(`${API_URL}/vehicles`, vehicleData).pipe(
      catchError(error => {
        console.error('Error creating vehicle', error);
        console.error('Response body:', error.error);
        console.error('Status:', error.status);
        throw error;
      })
    );
  }

  // Update an existing vehicle
  updateVehicle(id: number, vehicleData: Partial<Vehicle>): Observable<Vehicle> {
    console.log(`Updating vehicle ${id} with data:`, vehicleData);
    return this.http.put<Vehicle>(`${API_URL}/vehicles/${id}`, vehicleData).pipe(
      catchError(error => {
        console.error(`Error updating vehicle with ID ${id}`, error);
        console.error('Response body:', error.error);
        console.error('Status:', error.status);
        throw error;
      })
    );
  }

  // Delete a vehicle
  deleteVehicle(id: number): Observable<any> {
    return this.http.delete<any>(`${API_URL}/vehicles/${id}`).pipe(
      catchError(error => {
        console.error(`Error deleting vehicle with ID ${id}`, error);
        throw error;
      })
    );
  }

  // Dummy data for fallback
  private getDummyVehicles(): Vehicle[] {
    return [
      {
        id: 1,
        type: '4-wheeler',
        number_plate: 'GJ01AB1234',
        brand: 'Honda',
        model: 'City',
        color: 'Silver'
      },
      {
        id: 2,
        type: '4-wheeler',
        number_plate: 'GJ01XY5678',
        brand: 'Hyundai',
        model: 'i20',
        color: 'White'
      },
      {
        id: 3,
        type: '4-wheeler',
        number_plate: 'GJ01CD9876',
        brand: 'Toyota',
        model: 'Fortuner',
        color: 'Black'
      }
    ];
  }
} 