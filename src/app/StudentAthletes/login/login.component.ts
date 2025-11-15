import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth.service';
import { environment } from '../../../environments/environment';
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
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const registrationSuccess = sessionStorage.getItem('registrationSuccess');
    if (registrationSuccess) {
      this.successMessage = registrationSuccess;
      sessionStorage.removeItem('registrationSuccess'); // Clear the message
    }
    
    this.checkBackendAndDatabase();
  }

  /**
   * Check if backend and database are responding
   */
  private checkBackendAndDatabase(): void {
    console.log('🔍 Checking backend and database connectivity...');
    const startTime = Date.now();

    // Try to make a simple request to check backend connectivity
    // Using a lightweight endpoint that should always be available
    const healthCheckUrl = `${environment.apiUrl}/routes.php?request=getClasses&admin_id=0`;
    
    this.http.get(healthCheckUrl, { observe: 'response' }).subscribe({
      next: (response) => {
        const responseTime = Date.now() - startTime;
        console.log('✅ Backend Status: ONLINE');
        console.log(`   Response Time: ${responseTime}ms`);
        console.log(`   Status Code: ${response.status}`);
        console.log(`   Backend URL: ${environment.apiUrl}`);
        
        // Check if response has data structure (indicates DB connection)
        if (response.body) {
          const body = response.body as any;
          if (body.status || body.data !== undefined || body.payload !== undefined) {
            console.log('✅ Database Status: CONNECTED');
            console.log('   Response Structure: Valid');
          } else {
            console.log('⚠️  Database Status: UNKNOWN');
            console.log('   Response Structure: Unexpected format');
          }
        } else {
          console.log('⚠️  Database Status: UNKNOWN');
          console.log('   Response Body: Empty');
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      },
      error: (error) => {
        const responseTime = Date.now() - startTime;
        console.error('❌ Backend Status: OFFLINE or ERROR');
        console.error(`   Response Time: ${responseTime}ms`);
        console.error(`   Error:`, error);
        
        if (error.status === 0) {
          console.error('   Issue: Network error - Backend server may be down');
        } else if (error.status >= 500) {
          console.error('   Issue: Server error - Backend is responding but has issues');
        } else if (error.status === 404) {
          console.error('   Issue: Endpoint not found - Check API routes');
        } else {
          console.error(`   Issue: HTTP ${error.status} - ${error.statusText}`);
        }
        
        // Try to determine if it's a DB issue
        if (error.error && typeof error.error === 'object') {
          const errorMsg = JSON.stringify(error.error).toLowerCase();
          if (errorMsg.includes('database') || errorMsg.includes('sql') || errorMsg.includes('pdo')) {
            console.error('❌ Database Status: CONNECTION ERROR');
            console.error('   Issue: Database connection failed');
          }
        }
        
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
    });
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
      this.router.navigate(['/admin_login']);
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
