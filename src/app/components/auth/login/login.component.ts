import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgbAlertModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  forgotPasswordForm: FormGroup;
  otpForm: FormGroup;
  resetPasswordForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  showForgotPassword = false;
  showOtpForm = false;
  showResetPassword = false;
  contactNumber = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      contact_number: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', Validators.required]
    });

    this.forgotPasswordForm = this.fb.group({
      contact_number: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]]
    });

    this.resetPasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('password_confirmation')?.value;
    
    if (password !== confirmPassword) {
      form.get('password_confirmation')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    
    return null;
  }

  onLoginSubmit() {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { contact_number, password } = this.loginForm.value;
    this.authService.login(contact_number, password).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = response.message || 'Login successful';
        
        // Check for a redirect URL in sessionStorage
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin');
          this.router.navigateByUrl(redirectUrl);
        } else {
          // Default redirect based on user role
          const userId = this.authService.getUserId();
          const userRole = this.authService.getUserRole();
          
          if (userId && userRole) {
            if (userRole === 'owner') {
              this.router.navigate(['/owner', userId, 'dashboard']);
            } else {
              this.router.navigate(['/user', userId, 'dashboard']);
            }
          } else {
            // Fallback to home page if user info is not available
            this.router.navigate(['/']);
          }
        }
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Login failed. Please try again.';
        }
      }
    });
  }

  showForgotPasswordForm() {
    this.showForgotPassword = true;
    this.showOtpForm = false;
    this.showResetPassword = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  backToLogin() {
    this.showForgotPassword = false;
    this.showOtpForm = false;
    this.showResetPassword = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onForgotPasswordSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched(this.forgotPasswordForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword(this.forgotPasswordForm.value).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = response.message;
        this.showOtpForm = true;
        this.showForgotPassword = false;
        this.contactNumber = this.forgotPasswordForm.value.contact_number;
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Failed to send OTP. Please try again.';
        }
      }
    });
  }

  onOtpSubmit() {
    if (this.otpForm.invalid) {
      this.markFormGroupTouched(this.otpForm);
      return;
    }

    // If OTP is validated, show the reset password form
    this.showOtpForm = false;
    this.showResetPassword = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onResetPasswordSubmit() {
    if (this.resetPasswordForm.invalid) {
      this.markFormGroupTouched(this.resetPasswordForm);
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data = {
      contact_number: this.contactNumber,
      otp: this.otpForm.value.otp,
      password: this.resetPasswordForm.value.password,
      password_confirmation: this.resetPasswordForm.value.password_confirmation
    };

    this.authService.resetPassword(data).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = response.message;
        setTimeout(() => {
          this.backToLogin();
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting = false;
        if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Password reset failed. Please try again.';
        }
      }
    });
  }

  // Mark all form controls as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
} 