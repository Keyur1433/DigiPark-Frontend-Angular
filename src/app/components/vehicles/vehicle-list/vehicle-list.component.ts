import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { VehicleService, Vehicle } from '../../../services/vehicle.service';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, NgbModalModule],
  templateUrl: './vehicle-list.component.html',
  styleUrls: ['./vehicle-list.component.css']
})
export class VehicleListComponent implements OnInit {
  vehicles: Vehicle[] = [];
  isLoading = true;
  currentVehicle: Partial<Vehicle> = {};
  modalRef: NgbModalRef | null = null;
  isSubmitting = false;
  alertMessage = '';
  alertType = 'success';
  showAlert = false;

  constructor(
    private vehicleService: VehicleService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles() {
    this.isLoading = true;
    
    this.vehicleService.getUserVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load vehicles', error);
        this.isLoading = false;
        this.showAlertMessage('Failed to load vehicles. Please try again.', 'danger');
      }
    });
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
    
    this.isSubmitting = true;
    
    if (this.currentVehicle.id) {
      // Update existing vehicle
      this.vehicleService.updateVehicle(this.currentVehicle.id, this.currentVehicle).subscribe({
        next: () => {
          this.loadVehicles();
          this.isSubmitting = false;
          this.modalRef?.close();
          this.showAlertMessage('Vehicle updated successfully!', 'success');
        },
        error: (error) => {
          console.error('Failed to update vehicle', error);
          this.isSubmitting = false;
          this.showAlertMessage('Failed to update vehicle. Please try again.', 'danger');
        }
      });
    } else {
      // Add new vehicle
      this.vehicleService.createVehicle(this.currentVehicle as Omit<Vehicle, 'id'>).subscribe({
        next: () => {
          this.loadVehicles();
          this.isSubmitting = false;
          this.modalRef?.close();
          this.showAlertMessage('Vehicle added successfully!', 'success');
        },
        error: (error) => {
          console.error('Failed to add vehicle', error);
          this.isSubmitting = false;
          this.showAlertMessage('Failed to add vehicle. Please try again.', 'danger');
        }
      });
    }
  }

  deleteVehicle(vehicle: Vehicle) {
    if (confirm(`Are you sure you want to delete ${vehicle.brand} ${vehicle.model}?`)) {
      this.isLoading = true;
      
      this.vehicleService.deleteVehicle(vehicle.id).subscribe({
        next: () => {
          this.loadVehicles();
          this.showAlertMessage('Vehicle deleted successfully!', 'success');
        },
        error: (error) => {
          console.error('Failed to delete vehicle', error);
          this.isLoading = false;
          this.showAlertMessage('Failed to delete vehicle. Please try again.', 'danger');
        }
      });
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