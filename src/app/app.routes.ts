import { Routes } from '@angular/router';
import { authGuardFn } from './guards/auth.guard';
import { OWNER_ROUTES } from './owner/owner.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Login'
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent),
    title: 'Register'
  },
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
  ...OWNER_ROUTES,
  {
    path: '**',
    redirectTo: 'login'
  }
];