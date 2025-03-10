import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-register-admin',
  templateUrl: './register-admin.component.html',
  styleUrl: './register-admin.component.css',
  imports: [CommonModule, ReactiveFormsModule] // Add CommonModule and ReactiveFormsModule here
})
export class RegisterAdminComponent {
  registerForm: FormGroup;
  error: string = '';
  successMessage: string = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      adminCode: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.error = '';
      this.successMessage = '';

      const { username, email, password, adminCode } = this.registerForm.value;

      this.authService.Adminregister(username, email, password, adminCode)
        .subscribe({
          next: (response) => {
            this.successMessage = 'Admin account successfully registered!';
            setTimeout(() => {
              this.router.navigate(['/admin_login']);
            }, 1500);
          },
          error: (error) => {
            this.handleError(error);
            this.loading = false;
          }
        });
    }
  }

  private handleError(error: any) {
    this.error = error.error.message || 'Registration failed';
    console.error('Registration error:', error);
  }
}