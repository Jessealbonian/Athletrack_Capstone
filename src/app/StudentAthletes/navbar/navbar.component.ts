import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  title: string = 'Default Title'; // Initialize with a default title

  userId: number = 0;
  profile: any;
  name:  any;
  email: string = ''; // Change from username to email

  isDropdownOpen: boolean = false;

  constructor(private auth: AuthService, private http: HttpClient, private titleService: Title, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.auth.getCurrentUser().subscribe(user => {
      if (user) {
        console.log("This is the User Id", user);
        this.userId = user.id;
        console.log("This is the User Id", this.userId);
        // Export HOA user id for other components
        try {
          localStorage.setItem('hoa_user_id', String(this.userId));
        } catch (e) {}
        this.getProfile(this.userId);
      } else {
        this.profile = null; // No user logged in
        console.log("User not found");
      }
    });
    this.router.events.subscribe(() => {
      const currentRoute = this.route.snapshot.firstChild;
      if (currentRoute) {
        this.title = currentRoute.data['title'] || 'Default Title'; // Set title based on route
        this.titleService.setTitle(this.title); // Update the document title
      }
    });

  }

  getProfile(userId: number) {
    const url = `https://capstonebackend-9wrj.onrender.com/api/getHoaUserProf?userId=${userId}`;
    this.http.get(url).pipe(
      catchError(error => {
        console.error("Error fetching profile:", error);
        return [];
      })
    ).subscribe({
      next: (resp: any) => {
        console.log("API response:", resp);
        if (resp?.data && Array.isArray(resp.data) && resp.data.length > 0) {
          this.profile = resp.data[0];
          this.email = this.profile.email; // Store email instead of username
          localStorage.setItem('email', this.email); // Store email in localStorage
          // Export username for use in other components (e.g., class enrollment)
          this.name = this.profile.username;
          if (this.name) {
            localStorage.setItem('username', this.name);
          }
          console.log("Profile data:", this.profile);
          console.log("Email:", this.email);
          console.log("Username exported to localStorage:", this.name);
        } else {
          console.error("No profile data found for userId:", userId);
        }
      },
      error: (error) => {
        console.error("Error fetching profile:", error);
      }
    });
  }
  
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you really want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, log me out!',
      cancelButtonText: 'No, keep me logged in'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Logout Successful',
          text: 'You have been successfully logged out',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          this.auth.logout();
          localStorage.removeItem('currentUser');
          localStorage.removeItem('userToken');
          this.profile = null; // Clear the profile data
          this.router.navigate(['/login']);
        });
      }
    });
  }
}


