import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { BookingService } from './booking.service';

@Injectable({
  providedIn: 'root'
})
export class BookingStatusService implements OnDestroy {
  private statusRefreshSubscription: Subscription | null = null;
  private autoUpdateEnabled = false;
  
  // Status update notifications
  private statusUpdateSubject = new BehaviorSubject<{
    updatedAt: Date | null,
    message: string,
    completed: number
  }>({
    updatedAt: null,
    message: 'Status updates not started',
    completed: 0
  });
  
  public statusUpdates = this.statusUpdateSubject.asObservable();

  constructor(
    private bookingService: BookingService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // Start automatic status updates
  startAutoUpdate(intervalMinutes: number = 1): void {
    if (!isPlatformBrowser(this.platformId) || this.autoUpdateEnabled) {
      return;
    }

    console.log(`Starting automatic booking status updates every ${intervalMinutes} minutes`);
    this.autoUpdateEnabled = true;
    
    // Run immediate check on startup
    this.checkAndUpdateStatuses();
    
    // Setup interval for periodic checks
    this.statusRefreshSubscription = interval(intervalMinutes * 60 * 1000)
      .pipe(
        switchMap(() => {
          console.log('Running scheduled booking status check');
          return this.bookingService.processActiveBookings();
        })
      )
      .subscribe({
        next: (result) => {
          console.log('Automatic status update result:', result);
          this.statusUpdateSubject.next({
            updatedAt: new Date(),
            message: result.message,
            completed: result.completed
          });
        },
        error: (error) => {
          console.error('Error in automatic status update:', error);
        }
      });
  }

  // Manually trigger a status check and update
  checkAndUpdateStatuses(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    this.bookingService.processActiveBookings().subscribe({
      next: (result) => {
        console.log('Manual status update result:', result);
        this.statusUpdateSubject.next({
          updatedAt: new Date(),
          message: result.message,
          completed: result.completed
        });
      },
      error: (error) => {
        console.error('Error in manual status update:', error);
      }
    });
  }

  // Stop automatic updates
  stopAutoUpdate(): void {
    if (this.statusRefreshSubscription) {
      this.statusRefreshSubscription.unsubscribe();
      this.statusRefreshSubscription = null;
      this.autoUpdateEnabled = false;
      console.log('Automatic booking status updates stopped');
    }
  }

  // Clean up on service destroy
  ngOnDestroy(): void {
    this.stopAutoUpdate();
  }
} 