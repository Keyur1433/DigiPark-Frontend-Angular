import { Routes } from '@angular/router';
import { authGuardFn } from './guards/auth.guard';
import { publicGuardFn } from './guards/public.guard';
import { OWNER_ROUTES } from './owner/owner.routes';

export const routes: Routes = [
  // Public routes first
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
    title: 'Home - Parking App'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [publicGuardFn],
    title: 'Login'
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [publicGuardFn],
    title: 'Register'
  },
  
  // Parking locations - ensure public access first, no guard
  {
    path: 'parking-locations',
    loadComponent: () => import('./components/parking/parking-locations/parking-locations.component').then(m => m.ParkingLocationsComponent),
    title: 'Parking Locations',
    runGuardsAndResolvers: 'always'
  },
  {
    path: 'parking-locations/:id',
    loadComponent: () => import('./components/parking/location-details/location-details.component').then(m => m.LocationDetailsComponent),
    title: 'Parking Location Details'
  },
  {
    path: 'parking-locations/:id/booking',
    loadComponent: () => import('./components/booking/booking.component').then(m => m.BookingComponent),
    canActivate: [authGuardFn],
    title: 'Book Parking'
  },
  
  // Protected user routes  
  {
    path: 'user/:id/dashboard',
    canActivate: [authGuardFn],
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'Dashboard'
  },
  {
    path: 'user/:id/vehicles',
    canActivate: [authGuardFn],
    loadComponent: () => import('./components/vehicles/vehicle-list/vehicle-list.component').then(m => m.VehicleListComponent),
    title: 'My Vehicles'
  },
  {
    path: 'user/:id/parking-locations',
    canActivate: [authGuardFn],
    loadComponent: () => import('./components/parking/parking-locations/parking-locations.component').then(m => m.ParkingLocationsComponent),
    title: 'Parking Locations'
  },
  {
    path: 'user/:id/all-bookings',
    canActivate: [authGuardFn],
    loadComponent: () => import('../app/components/bookings/all-bookings/all-bookings.component').then(m => m.AllBookingsComponent),
    title: 'All Bookings'
  },
  
  ...OWNER_ROUTES,
  
  // Fallback route - navigate to home
  {
    path: '**',
    redirectTo: ''
  }
];