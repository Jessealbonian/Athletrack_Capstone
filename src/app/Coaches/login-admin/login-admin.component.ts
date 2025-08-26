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
  showBuffer = false;
  bufferMessage = '';
  
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
            this.router.navigate(['Class']);
          },
          error: (error) => {
            Swal.fire({
              title: 'Account Not Found',
              text: 'No account exists with these credentials. Would you like to create one?',
              icon: 'question',
              showCancelButton: true,
              confirmButtonText: 'Yes, Register',
              cancelButtonText: 'Try Again'
            }).then((result) => {
              if (result.isConfirmed) {
                this.router.navigate(['/register_admin']);
              }
            });
            this.error = error.error.message || 'Login failed';
            console.error('Login error:', error);
          }
        });
    }
  }

  showStudentBuffer() {
    this.showBuffer = true;
    this.bufferMessage = 'Switching to student...';
    setTimeout(() => {
      this.showBuffer = false;
      this.router.navigate(['/login']);
    }, Math.floor(Math.random() * 3000) + 2000); // 2-5 seconds
  }
}  