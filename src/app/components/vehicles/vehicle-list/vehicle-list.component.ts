import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModalModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { VehicleService, Vehicle } from '../../../services/vehicle.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, NgbModalModule, NgbDropdownModule],
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.css']
})
export class VehicleListComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('confirmDeleteModal') confirmDeleteModal: any;
  
  vehicles: Vehicle[] = [];
  isLoading = true;
  currentVehicle: any = {
    type: '',
    number_plate: '',
    brand: '',
    model: '',
    color: ''
  };
  vehicleToDelete: Vehicle | null = null;
  modalRef: NgbModalRef | null = null;
  isSubmitting = false;
  alertMessage = '';
  alertType = 'success';
  showAlert = false;
  modalAlertMessage: string | null = '';
  modalAlertType = 'danger';
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
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
    
    // Clear any previous modal alert messages
    this.modalAlertMessage = '';
    
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
          
          // Detect specific error for duplicate number plate
          if (error.error?.message && error.error.message.includes("number plate must be unique")) {
            this.showModalAlert('Failed to update vehicle: The number plate is already in use', 'danger');
          } else {
            // Display other error messages in the modal
            this.showModalAlert(`Failed to update vehicle: ${error.error?.message || 'Please try again.'}`, 'danger');
          }
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
          
          // Detect specific error for duplicate number plate
          if (error.error?.message && error.error.message.includes("number plate must be unique")) {
            this.showModalAlert('Failed to add vehicle: The number plate is already in use', 'danger');
          } else {
            // Display other error messages in the modal
            this.showModalAlert(`Failed to add vehicle: ${error.error?.message || 'Please try again.'}`, 'danger');
          }
        }
      });
      
      this.subscriptions.push(sub);
    }
  }

  openConfirmDeleteModal(vehicle: Vehicle): void {
    this.vehicleToDelete = vehicle;
    const modalRef = this.modalService.open(this.confirmDeleteModal, {
      centered: true,
      backdrop: 'static'
    });
    
    modalRef.result.then(
      (result) => {
        if (result === 'confirm' && this.vehicleToDelete) {
          this.deleteVehicle(this.vehicleToDelete);
        }
      },
      () => {
        // Modal dismissed, do nothing
        this.vehicleToDelete = null;
      }
    );
  }

  deleteVehicle(vehicle: Vehicle): void {
    this.isLoading = true;
    this.vehicleService.deleteVehicle(vehicle.id).subscribe({
      next: () => {
        this.loadVehicles();
        this.showAlertMessage('Vehicle deleted successfully!', 'success');
      },
      error: (error) => {
        this.showAlertMessage('Error deleting vehicle', 'danger');
        this.isLoading = false;
      }
    });
  }

  validateVehicleForm(): boolean {
    if (!this.currentVehicle.number_plate || this.currentVehicle.number_plate.trim() === '') {
      this.showModalAlert('Number plate is required', 'danger');
      return false;
    }
    
    if (!this.currentVehicle.type || this.currentVehicle.type.trim() === '') {
      this.showModalAlert('Vehicle type is required', 'danger');
      return false;
    }
    
    if (!this.currentVehicle.brand || this.currentVehicle.brand.trim() === '') {
      this.showModalAlert('Brand is required', 'danger');
      return false;
    }
    
    if (!this.currentVehicle.model || this.currentVehicle.model.trim() === '') {
      this.showModalAlert('Model is required', 'danger');
      return false;
    }
    
    return true;
  }

  showModalAlert(message: string | null, type: 'success' | 'danger') {
    this.modalAlertMessage = message;
    this.modalAlertType = type;
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