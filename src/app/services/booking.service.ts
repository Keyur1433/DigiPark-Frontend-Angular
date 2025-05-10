import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of, switchMap, timer, interval } from 'rxjs';
import { catchError, tap, retry, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Booking } from '../models/booking.model';
import { isPlatformBrowser } from '@angular/common';

interface BookingData {
  parking_location_id: number;
  vehicle_id: number;
  parking_slot_id: number;
  duration_hours?: number;
  date?: string;
  start_time?: string;
  end_time?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = environment.apiUrl;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    console.log('BookingService initialized with API URL:', this.apiUrl);
  }

  // Get available parking slots for a location, date and time range
  getAvailableSlots(
    locationId: string | number, 
    date: string, 
    startTime: string, 
    endTime: string, 
    vehicleType?: string
  ): Observable<any> {
    console.log(`Fetching available slots for location ${locationId} on ${date} from ${startTime} to ${endTime}`);
    
    let params = new HttpParams()
      .set('date', date)
      .set('start_time', startTime)
      .set('end_time', endTime);
    
    if (vehicleType) {
      params = params.set('vehicle_type', vehicleType);
    }
    
    return this.http.get<any>(`${this.apiUrl}/parking-locations/${locationId}/available-slots`, { params })
      .pipe(
        tap(response => console.log('Available slots retrieved:', response)),
        catchError(this.handleError('getAvailableSlots', {}))
      );
  }

  // Create an immediate check-in booking
  createBooking(bookingData: BookingData): Observable<any> {
    console.log('Creating check-in booking with data:', bookingData);
    
    // Format the data exactly as expected by the API
    const formattedData = {
      parking_location_id: Number(bookingData.parking_location_id),
      vehicle_id: Number(bookingData.vehicle_id),
      parking_slot_id: Number(bookingData.parking_slot_id),
      duration_hours: bookingData.duration_hours
    };
    
    console.log(`Sending request to ${this.apiUrl}/bookings/check-in with data:`, JSON.stringify(formattedData));
    
    // Get auth token from localStorage if available
    let token = '';
    if (this.isBrowser) {
      token = localStorage.getItem('access_token') || '';
    }
    
    // Include auth token if available
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
    
    return this.http.post(`${this.apiUrl}/bookings/check-in`, formattedData, { headers })
      .pipe(
        tap(response => {
          console.log('Check-in booking API response:', response);
          console.log('Check-in booking created successfully:', response);
        }),
        catchError(error => {
          console.error('Error creating check-in booking. Status:', error.status);
          console.error('Error details:', error);
          console.error('Error response body:', error.error);
          
          if (error.status === 401) {
            console.error('Authentication error - token may be invalid or expired');
          } else if (error.status === 403) {
            console.error('Permission denied - user may not have booking privileges');
          } else if (error.status === 422) {
            console.error('Validation error - data format may be incorrect');
            console.error('Validation errors:', error.error?.errors);
          } else if (error.status === 0) {
            console.error('Possible CORS issue or network error');
          }
          
          return throwError(() => error);
        })
      );
  }

  // Create an advanced booking
  createAdvancedBooking(bookingData: BookingData): Observable<any> {
    console.log('Creating advanced booking with data:', bookingData);
    
    // Format the data exactly as expected by the API
    const formattedData = {
      parking_location_id: Number(bookingData.parking_location_id),
      vehicle_id: Number(bookingData.vehicle_id),
      parking_slot_id: Number(bookingData.parking_slot_id),
      date: bookingData.date,
      start_time: bookingData.start_time,
      end_time: bookingData.end_time
    };
    
    console.log(`Sending request to ${this.apiUrl}/bookings/advance with data:`, JSON.stringify(formattedData));
    
    // Get auth token from localStorage if available
    let token = '';
    if (this.isBrowser) {
      token = localStorage.getItem('access_token') || '';
    }
    
    // Include auth token if available
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
    
    // Try different API endpoint formats
    return this.attemptBookingRequest(formattedData, headers);
  }

  private attemptBookingRequest(formattedData: any, headers: HttpHeaders): Observable<any> {
    console.log('Attempting booking request with headers:', headers);
    
    return this.http.post(`${this.apiUrl}/bookings/advance`, formattedData, { headers })
      .pipe(
        tap(response => {
          console.log('Advanced booking API response:', response);
          console.log('Advanced booking created successfully:', response);
        }),
        catchError(error => {
          console.error('Error creating advanced booking. Status:', error.status);
          console.error('Error details:', error);
          console.error('Error response body:', error.error);
          
          if (error.status === 401) {
            console.error('Authentication error - token may be invalid or expired');
          } else if (error.status === 403) {
            console.error('Permission denied - user may not have booking privileges');
          } else if (error.status === 422) {
            console.error('Validation error - data format may be incorrect');
            console.error('Validation errors:', error.error?.errors);
          } else if (error.status === 0) {
            console.error('Possible CORS issue or network error');
          }
          
          // Rethrow the error for component handling
          return throwError(() => error);
        })
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
          } else if (response === null || response === '') {
            console.log('API returned null or empty response');
            return [];
          } else {
            console.log('Unexpected booking response format:', response);
            return [];
          }
        }),
        tap(bookings => {
          console.log(`Retrieved ${bookings.length} bookings for user`);
          if (bookings.length > 0) {
            console.log('First booking sample:', bookings[0]);
            
            // Store the API response in localStorage only if we have valid bookings
            if (this.isBrowser) {
              try {
                // Create a cache object with bookings keyed by ID
                const bookingsCache: { [key: string]: { timestamp: number, data: any } } = {};
                bookings.forEach((booking: any) => {
                  if (booking && booking.id) {
                    bookingsCache[booking.id] = {
                      timestamp: Date.now(),
                      data: booking
                    };
                  }
                });
                
                // Only store non-empty cache
                if (Object.keys(bookingsCache).length > 0) {
                  localStorage.setItem('bookings_cache', JSON.stringify(bookingsCache));
                  
                  // Also store the recent booking IDs for quick access
                  const recentIds = bookings.slice(0, 5).map((b: any) => b.id);
                  localStorage.setItem('recent_bookings', JSON.stringify(recentIds));
                }
              } catch (e) {
                console.error('Error caching bookings:', e);
              }
            }
          } else {
            console.log('No bookings returned from API');
            // If API returns empty, clear any cached bookings data
            if (this.isBrowser) {
              try {
                localStorage.removeItem('bookings_cache');
                localStorage.removeItem('recent_bookings');
              } catch (e) {
                console.error('Error clearing cached bookings:', e);
              }
            }
          }
        }),
        retry(1),
        catchError(error => {
          console.error('Error fetching bookings:', error);
          // Return empty array as fallback
          return of([]);
        })
      );
  }

  getBookingDetails(bookingId: string): Observable<any> {
    console.log(`Fetching details for booking ${bookingId}`);
    return this.http.get<any>(`${this.apiUrl}/bookings/${bookingId}`)
      .pipe(
        map(response => {
          console.log('Raw booking details response:', response);
          
          // Handle different response formats
          if (response && response.booking) {
            // Backend returns nested in 'booking' property
            return response.booking;
          } else if (response && typeof response === 'object' && response.id) {
            // Backend returns booking object directly
            return response;
          } else {
            console.warn('Unexpected booking details format:', response);
            return response;
          }
        }),
        tap(booking => console.log('Booking details processed:', booking)),
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

  completeBooking(bookingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/bookings/${bookingId}/complete`, {});
  }

  // Get slot availability for a specific date
  getSlotAvailabilityByDate(locationId: string | number, date: string): Observable<any> {
    console.log(`Fetching slot availability for location ${locationId} on ${date}`);
    
    let params = new HttpParams().set('date', date);
    
    return this.http.get<any>(`${this.apiUrl}/parking-locations/${locationId}/availability-by-date`, { params })
      .pipe(
        tap(response => console.log('Slot availability retrieved:', response)),
        catchError(this.handleError('getSlotAvailabilityByDate', {}))
      );
  }

  // Auto-update booking statuses based on current time
  updateBookingStatuses(): Observable<any> {
    console.log('Updating booking statuses based on current time');
    return this.http.post<any>(`${this.apiUrl}/bookings/update-statuses`, {})
      .pipe(
        tap(response => console.log('Booking statuses updated:', response)),
        catchError(this.handleError('updateBookingStatuses', {}))
      );
  }

  // Setup automatic refreshing of booking statuses
  setupAutoRefresh(intervalMinutes: number = 5): Observable<any> {
    if (this.isBrowser) {
      console.log(`Setting up automatic status refresh every ${intervalMinutes} minutes`);
      return interval(intervalMinutes * 60 * 1000).pipe(
        switchMap(() => this.updateBookingStatuses()),
        shareReplay(1)
      );
    }
    return of(null);
  }

  // Get user's active bookings that need to be checked for completion
  getActiveBookingsForStatusCheck(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/bookings/active`)
      .pipe(
        map(response => {
          if (Array.isArray(response)) {
            return response;
          } else if (response && response.bookings && Array.isArray(response.bookings)) {
            return response.bookings;
          } else {
            return [];
          }
        }),
        catchError(this.handleError('getActiveBookingsForStatusCheck', []))
      );
  }

  // Check if a booking should be marked as completed based on current time
  checkBookingCompletion(booking: any): boolean {
    if (!booking || !booking.check_out_time) return false;
    
    const now = new Date();
    const checkOutTime = new Date(booking.check_out_time);
    
    return now >= checkOutTime;
  }

  // Move a booking to completed status
  markBookingAsCompleted(bookingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/bookings/${bookingId}/complete`, {})
      .pipe(
        tap(response => console.log(`Booking ${bookingId} marked as completed:`, response)),
        catchError(this.handleError('markBookingAsCompleted', {}))
      );
  }

  // Process all active bookings and check if they should be completed
  processActiveBookings(): Observable<any> {
    return this.getActiveBookingsForStatusCheck().pipe(
      switchMap(bookings => {
        const bookingsToComplete = bookings.filter(booking => this.checkBookingCompletion(booking));
        
        if (bookingsToComplete.length === 0) {
          return of({ message: 'No bookings to complete', completed: 0 });
        }
        
        const completionRequests = bookingsToComplete.map(booking => 
          this.markBookingAsCompleted(booking.id)
        );
        
        return completionRequests.length > 0 
          ? of({ message: `Completed ${completionRequests.length} bookings`, completed: completionRequests.length })
          : of({ message: 'No bookings to complete', completed: 0 });
      }),
      catchError(error => {
        console.error('Error processing active bookings:', error);
        return of({ message: 'Error processing bookings', error: error });
      })
    );
  }

  /**
   * Handle Http operation failures
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);

      // Server-side safe error handling
      if (this.isBrowser) {
        if (error.error instanceof ErrorEvent) {
          // A client-side or network error occurred
          console.error(`Client error in ${operation}:`, error.error.message);
        } else {
          // The backend returned an unsuccessful response code
          console.error(
            `Backend returned code ${error.status} in ${operation}, ` +
            `body was:`, error.error);
        }
      } else {
        console.error(`Server-side error in ${operation}:`, error.message);
      }

      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
} 