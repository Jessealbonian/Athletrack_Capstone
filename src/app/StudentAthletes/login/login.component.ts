import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginData = {
    email: '',
    password: '',
    rememberMe: false
  };
  showPassword = false;
  showForgotPasswordModal = false;
  resetEmail: string = '';
  error: string = '';
  successMessage: string = '';
  showBuffer = false;
  bufferMessage = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const registrationSuccess = sessionStorage.getItem('registrationSuccess');
    if (registrationSuccess) {
      this.successMessage = registrationSuccess;
      sessionStorage.removeItem('registrationSuccess'); // Clear the message
    }
  }

  onSubmit() {
    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        const token = response.jwt; 
        localStorage.setItem('jwtToken', token); 
        this.authService.setToken(response.jwt);
        Swal.fire({
          title: 'Success!',
          text: 'Successfully signed in, Welcome to Athletrack!',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
        localStorage.setItem('currentUser', JSON.stringify(response));
        localStorage.setItem('isLoggedIn', 'true');
        
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
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
            this.router.navigate(['/register']);
          }
        });
        this.error = error.error.message || 'Login failed';
        console.error('Login error:', error);
      }
    });
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  navigateToAdmin() {
    this.router.navigate(['/admin_login']);
  }

  openForgotPasswordModal() {
    this.showForgotPasswordModal = true;
  }

  onResetPasswordSubmit() {
    console.log('Password reset requested for:', this.resetEmail);
    this.showForgotPasswordModal = false;
  }

  showAdminBuffer() {
    this.showBuffer = true;
    this.bufferMessage = 'Switching to admin...';
    setTimeout(() => {
      this.showBuffer = false;
      this.router.navigate(['/login_admin']);
    }, Math.floor(Math.random() * 3000) + 2000); // 2-5 seconds
  }

  showRegisterBuffer() {
    this.showBuffer = true;
    this.bufferMessage = 'Switching to register...';
    setTimeout(() => {
      this.showBuffer = false;
      this.router.navigate(['/register']);
    }, Math.floor(Math.random() * 3000) + 2000); // 2-5 seconds
  }
}
