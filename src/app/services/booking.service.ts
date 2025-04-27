import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, retry, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Booking } from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    console.log('BookingService initialized with API URL:', this.apiUrl);
  }

  createBooking(bookingData: {
    parking_location_id: string;
    vehicle_id: string;
    duration_hours: number;
  }): Observable<any> {
    console.log('Creating booking with data:', bookingData);
    return this.http.post<any>(`${this.apiUrl}/bookings/check-in`, bookingData)
      .pipe(
        tap(response => console.log('Booking created successfully:', response)),
        catchError(this.handleError('createBooking'))
      );
  }

  getUserBookings(): Observable<any[]> {
    console.log('Fetching user bookings from API');
    return this.http.get<any>(`${this.apiUrl}/bookings`)
      .pipe(
        map(response => {
          // Handle different response formats (array or object with bookings property)
          if (Array.isArray(response)) {
            console.log(`Got ${response.length} bookings directly`);
            return response;
          } else if (response && response.bookings && Array.isArray(response.bookings)) {
            console.log(`Got ${response.bookings.length} bookings from response.bookings`);
            return response.bookings;
          } else {
            console.log('Unexpected booking response format:', response);
            return [];
          }
        }),
        tap(bookings => {
          console.log(`Retrieved ${bookings.length} bookings for user`);
          if (bookings.length > 0) {
            console.log('First booking sample:', bookings[0]);
          }
        }),
        retry(1),
        catchError(this.handleError('getUserBookings', []))
      );
  }

  getBookingDetails(bookingId: string): Observable<any> {
    console.log(`Fetching details for booking ${bookingId}`);
    return this.http.get<any>(`${this.apiUrl}/bookings/${bookingId}`)
      .pipe(
        tap(booking => console.log('Booking details retrieved:', booking)),
        catchError(this.handleError(`getBookingDetails id=${bookingId}`))
      );
  }

  cancelBooking(bookingId: string): Observable<any> {
    console.log(`Cancelling booking ${bookingId}`);
    return this.http.post<any>(`${this.apiUrl}/bookings/${bookingId}/cancel`, {})
      .pipe(
        tap(response => console.log('Booking cancelled successfully:', response)),
        catchError(this.handleError(`cancelBooking id=${bookingId}`))
      );
  }

  checkOutBooking(bookingId: string): Observable<any> {
    console.log(`Checking out booking ${bookingId}`);
    return this.http.post<any>(`${this.apiUrl}/bookings/${bookingId}/check-out`, {})
      .pipe(
        tap(response => console.log('Booking checked out successfully:', response)),
        catchError(this.handleError(`checkOutBooking id=${bookingId}`))
      );
  }

  /**
   * Handle Http operation failures
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);

      if (error.error instanceof ErrorEvent) {
        // A client-side or network error occurred
        console.error(`Client error in ${operation}:`, error.error.message);
      } else {
        // The backend returned an unsuccessful response code
        console.error(
          `Backend returned code ${error.status} in ${operation}, ` +
          `body was:`, error.error);
      }

      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
} 