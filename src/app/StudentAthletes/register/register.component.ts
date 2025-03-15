import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [CommonModule, ReactiveFormsModule],
  standalone: true
})
export class RegisterComponent {
  registerForm: FormGroup;
  hidePassword = true;
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
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null
      : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.error = '';
      this.successMessage = '';

      const { username, email, password } = this.registerForm.value;

      this.authService.register({ username, email, password })
        .subscribe({
          next: (response) => {
            this.successMessage = 'Account successfully registered!';
            sessionStorage.setItem('registrationSuccess', 'Account successfully registered! Please login.');
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 1500);
          },
          error: (error) => {
            this.error = error.error.message || 'Registration failed';
            console.error('Registration error:', error);
            this.loading = false;
          }
        });
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  signInWithGoogle() {
    // TODO: Implement Google authentication
    console.log('Google sign-in clicked');
  }

  signInWithFacebook() {
    // TODO: Implement Facebook authentication
    console.log('Facebook sign-in clicked');
  }
}
