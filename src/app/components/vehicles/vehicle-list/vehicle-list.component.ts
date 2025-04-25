import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModalModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { VehicleService, Vehicle } from '../../../services/vehicle.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, NgbModalModule, NgbDropdownModule],
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.css']
})
export class VehicleListComponent implements OnInit, OnDestroy, AfterViewInit {
  vehicles: Vehicle[] = [];
  isLoading = true;
  currentVehicle: Partial<Vehicle> = {};
  modalRef: NgbModalRef | null = null;
  isSubmitting = false;
  alertMessage = '';
  alertType = 'success';
  showAlert = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private vehicleService: VehicleService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewInit(): void {
    // Make sure the dropdown menu is properly initialized
    this.initializeDropdowns();
  }

  // Initialize Bootstrap dropdowns
  private initializeDropdowns(): void {
    // This is a check if we're in a browser environment
    if (typeof document !== 'undefined') {
      console.log('Initializing dropdowns...');
      // We're using NgbDropdown instead of Bootstrap's native dropdown
    }
  }

  loadVehicles() {
    this.isLoading = true;
    
    const sub = this.vehicleService.getUserVehicles().subscribe({
      next: (vehicles) => {
        console.log('Loaded vehicles:', vehicles);
        this.vehicles = vehicles;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load vehicles', error);
        this.isLoading = false;
        this.showAlertMessage('Failed to load vehicles. Please try again.', 'danger');
      }
    });
    
    this.subscriptions.push(sub);
  }

  openModal(content: any, vehicle?: Vehicle) {
    if (vehicle) {
      this.currentVehicle = { ...vehicle };
    } else {
      this.currentVehicle = {};
    }
    
    this.modalRef = this.modalService.open(content, { centered: true });
  }

  submitVehicle() {
    if (!this.validateVehicleForm()) {
      return;
    }
    
    // Log the vehicle data before submission for debugging
    console.log('Submitting vehicle data:', this.currentVehicle);
    
    this.isSubmitting = true;
    
    if (this.currentVehicle.id) {
      // Update existing vehicle
      const sub = this.vehicleService.updateVehicle(this.currentVehicle.id, this.currentVehicle).subscribe({
        next: (response) => {
          console.log('Vehicle updated successfully:', response);
          this.isSubmitting = false;
          this.modalRef?.close();
          this.showAlertMessage('Vehicle updated successfully!', 'success');
          // Reload vehicles after a short delay
          setTimeout(() => this.loadVehicles(), 300);
        },
        error: (error) => {
          console.error('Failed to update vehicle', error);
          this.isSubmitting = false;
          this.showAlertMessage(`Failed to update vehicle: ${error.error?.message || 'Please try again.'}`, 'danger');
        }
      });
      
      this.subscriptions.push(sub);
    } else {
      // Add new vehicle
      const sub = this.vehicleService.createVehicle(this.currentVehicle as Omit<Vehicle, 'id'>).subscribe({
        next: (response) => {
          console.log('Vehicle added successfully:', response);
          this.isSubmitting = false;
          this.modalRef?.close();
          this.showAlertMessage('Vehicle added successfully!', 'success');
          // Reload vehicles after a short delay
          setTimeout(() => this.loadVehicles(), 300);
        },
        error: (error) => {
          console.error('Failed to add vehicle', error);
          console.error('Error details:', error.error);
          this.isSubmitting = false;
          this.showAlertMessage(`Failed to add vehicle: ${error.error?.message || 'Please try again.'}`, 'danger');
        }
      });
      
      this.subscriptions.push(sub);
    }
  }

  deleteVehicle(vehicle: Vehicle) {
    if (confirm(`Are you sure you want to delete ${vehicle.brand} ${vehicle.model}?`)) {
      this.isLoading = true;
      
      const sub = this.vehicleService.deleteVehicle(vehicle.id).subscribe({
        next: () => {
          this.showAlertMessage('Vehicle deleted successfully!', 'success');
          // Reload vehicles after a short delay
          setTimeout(() => this.loadVehicles(), 300);
        },
        error: (error) => {
          console.error('Failed to delete vehicle', error);
          this.isLoading = false;
          this.showAlertMessage('Failed to delete vehicle. Please try again.', 'danger');
        }
      });
      
      this.subscriptions.push(sub);
    }
  }

  validateVehicleForm(): boolean {
    if (!this.currentVehicle.number_plate || this.currentVehicle.number_plate.trim() === '') {
      this.showAlertMessage('Number plate is required', 'danger');
      return false;
    }
    
    if (!this.currentVehicle.type || this.currentVehicle.type.trim() === '') {
      this.showAlertMessage('Vehicle type is required', 'danger');
      return false;
    }
    
    if (!this.currentVehicle.brand || this.currentVehicle.brand.trim() === '') {
      this.showAlertMessage('Brand is required', 'danger');
      return false;
    }
    
    if (!this.currentVehicle.model || this.currentVehicle.model.trim() === '') {
      this.showAlertMessage('Model is required', 'danger');
      return false;
    }
    
    return true;
  }

  showAlertMessage(message: string, type: 'success' | 'danger') {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    
    setTimeout(() => {
      this.showAlert = false;
    }, 5000);
  }
} 