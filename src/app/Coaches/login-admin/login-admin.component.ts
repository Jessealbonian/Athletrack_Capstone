import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth.service';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login-admin',
  templateUrl: './login-admin.component.html',
  styleUrl: './login-admin.component.css',
  imports: [CommonModule, ReactiveFormsModule] // Add CommonModule and ReactiveFormsModule here
})
export class LoginAdminComponent implements OnInit {
  loginForm: FormGroup;
  error: string = '';
  loading = false;
  showPassword: boolean = false;
  showBuffer = false;
  bufferMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      adminCode: ['', Validators.required]
    });
  }

  ngOnInit(): void {
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
            Swal.fire({
              title: 'Login Failed',
              text: error.error?.message || 'Invalid credentials. Please try again.',
              icon: 'error'
            });
            this.error = error.error?.message || 'Login failed';
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