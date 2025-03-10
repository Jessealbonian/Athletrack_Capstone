import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login-admin',
  templateUrl: './login-admin.component.html',
  styleUrl: './login-admin.component.css',
  imports: [CommonModule, ReactiveFormsModule] // Add CommonModule and ReactiveFormsModule here
})
export class LoginAdminComponent {
  loginForm: FormGroup;
  error: string = '';
  loading = false;
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      adminCode: ['', Validators.required]
    });
  }
  
  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = '';

      // Transfer form values to `data`
      const { email, password, adminCode } = this.loginForm.value;
  
      this.auth.loginAdmin(email, password, adminCode)
        .subscribe({
          next: (response: { jwt: string }) => {
            this.auth.setToken(response.jwt);
            Swal.fire({
              title: 'Success!',
              text: 'Login successful!',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
            this.router.navigate(['home']);
          },
          error: (error) => {
            this.error = error.error.message || 'Login failed';
            this.loading = false;
          }
        });
    }
  }
}  