import { Routes } from '@angular/router';
import { authGuardFn } from '../guards/auth.guard';
import { ownerGuardFn } from '../guards/owner.guard';

export const OWNER_ROUTES: Routes = [
  {
    path: 'owner/:id',
    canActivate: [authGuardFn, ownerGuardFn],
    loadComponent: () => import('./shared/owner-layout/owner-layout.component').then(m => m.OwnerLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./owner-dashboard/owner-dashboard.component').then(m => m.OwnerDashboardComponent),
        title: 'Owner Dashboard'
      },
      {
        path: 'parking-locations',
        loadComponent: () => import('./parking-locations/owner-parking-locations.component').then(m => m.OwnerParkingLocationsComponent),
        title: 'My Parking Locations'
      },
      {
        path: 'parking-locations/add',
        loadComponent: () => import('./parking-locations/add-parking-location/add-parking-location.component').then(m => m.AddParkingLocationComponent),
        title: 'Add Parking Location'
      },
      {
        path: 'parking-locations/edit/:locationId',
        loadComponent: () => import('./parking-locations/edit-parking-location/edit-parking-location.component').then(m => m.EditParkingLocationComponent),
        title: 'Edit Parking Location'
      },
      {
        path: 'bookings',
        loadComponent: () => import('./bookings/owner-bookings.component').then(m => m.OwnerBookingsComponent),
        title: 'Booking Management'
      },
      {
        path: 'bookings/:bookingId',
        loadComponent: () => import('./bookings/booking-details/booking-details.component').then(m => m.BookingDetailsComponent),
        title: 'Booking Details'
      },
      {
        path: 'reports',
        loadComponent: () => import('./reports/owner-reports.component').then(m => m.OwnerReportsComponent),
        title: 'Reports & Analytics'
      }
    ]
  }
]; 