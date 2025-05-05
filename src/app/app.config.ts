import { ApplicationConfig, importProvidersFrom, isDevMode, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding, withDebugTracing, withHashLocation, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LocationStrategy, PathLocationStrategy, PlatformLocation } from '@angular/common';
import { HistoryService } from './services/history.service';
import { BookingStatusService } from './services/booking-status.service';

// History service initialization function
function initializeHistoryService(historyService: HistoryService) {
  return () => {
    // The service will automatically start tracking history when injected
    return historyService;
  };
}

// Booking status service initialization
function initializeBookingStatusService(bookingStatusService: BookingStatusService) {
  return () => {
    // Start automatic booking status updates every minute
    bookingStatusService.startAutoUpdate(1);
    return bookingStatusService;
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      withRouterConfig({
        onSameUrlNavigation: 'reload',
        paramsInheritanceStrategy: 'always',
        urlUpdateStrategy: 'eager',
        canceledNavigationResolution: 'replace'
      })
    ),
    { provide: LocationStrategy, useClass: PathLocationStrategy },
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    // Initialize history service
    {
      provide: APP_INITIALIZER,
      useFactory: initializeHistoryService,
      deps: [HistoryService],
      multi: true
    },
    // Initialize booking status service
    {
      provide: APP_INITIALIZER,
      useFactory: initializeBookingStatusService,
      deps: [BookingStatusService],
      multi: true
    },
    importProvidersFrom(
      ToastrModule.forRoot({
        timeOut: 3000,
        positionClass: 'toast-top-right',
        preventDuplicates: true,
      }),
      BrowserAnimationsModule
    )
  ]
};
