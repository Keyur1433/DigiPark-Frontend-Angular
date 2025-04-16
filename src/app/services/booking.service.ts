import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  /**
   * Get user bookings
   */
  getUserBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bookings`).pipe(
      catchError(error => {
        console.error('Error getting user bookings:', error);
        // Return mock data on error
        return of([
          { 
            id: 1, 
            parking_location_name: 'Downtown Parking', 
            start_time: '2023-07-15T09:00:00', 
            end_time: '2023-07-15T17:00:00',
            status: 'active',
            amount: 35
          },
          { 
            id: 2, 
            parking_location_name: 'East Side Garage', 
            start_time: '2023-07-14T08:30:00', 
            end_time: '2023-07-14T14:30:00',
            status: 'completed',
            amount: 24
          },
          { 
            id: 3, 
            parking_location_name: 'North Station Lot', 
            start_time: '2023-07-14T12:00:00', 
            end_time: '2023-07-15T12:00:00',
            status: 'active',
            amount: 48
          }
        ]);
      })
    );
  }

  /**
   * Get booking details
   */
  getBookingDetails(bookingId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/bookings/${bookingId}`).pipe(
      catchError(error => {
        console.error('Error getting booking details:', error);
        // Return mock data on error
        return of({
          id: bookingId,
          parking_location_name: 'Downtown Parking',
          start_time: '2023-07-15T09:00:00',
          end_time: '2023-07-15T17:00:00',
          status: 'active',
          amount: 35,
          vehicle: {
            number_plate: 'GJ01AB1234',
            type: 'Car',
            brand: 'Honda',
            model: 'City'
          }
        });
      })
    );
  }

  /**
   * Cancel a booking
   */
  cancelBooking(bookingId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bookings/${bookingId}/cancel`, {}).pipe(
      catchError(error => {
        console.error('Error canceling booking:', error);
        return of({ success: false, message: 'Failed to cancel booking' });
      })
    );
  }
} 