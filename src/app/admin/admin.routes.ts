import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './shared/admin-layout/admin-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UserListComponent } from './users/user-list/user-list.component';
import { UserDetailsComponent } from './users/user-details/user-details.component';
import { BookingListComponent } from './bookings/booking-list/booking-list.component';
import { LocationListComponent } from './parking-locations/location-list/location-list.component';
import { adminGuardFn } from '../guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: ':id',
    component: AdminLayoutComponent,
    canActivate: [adminGuardFn],
    children: [
      { path: 'dashboard', component: DashboardComponent, title: 'Admin Dashboard' },
      { path: 'users', component: UserListComponent, title: 'User Management' },
      { path: 'users/:userId', component: UserDetailsComponent, title: 'User Details' },
      { path: 'bookings', component: BookingListComponent, title: 'Booking Management' },
      { path: 'parking-locations', component: LocationListComponent, title: 'Parking Locations' },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
]; 