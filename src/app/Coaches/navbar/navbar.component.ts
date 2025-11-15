import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';
import { catchError } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  userId: number = 0;
  profile: any;
  username: string = '';

  
  isDropdownOpen: boolean = false;

constructor(private auth: AuthService, private http: HttpClient, private router: Router) {}

ngOnInit() {
  this.auth.getCurrentUser().subscribe(user => {
    if (user) {
      console.log("This is the User Id", user);
      this.userId = user.id;
      console.log("This is the User Id", this.userId);
      this.getProfile(this.userId);
    } else {
      this.profile = null; // No user logged in
      console.log("User not found");
    }
  });
}


getProfile(userId: number) {
  const url = `${environment.apiUrl}/routes.php?request=getHoaAdminProf/${userId}`;
  this.http.get(url).pipe(
    catchError(error => {
      console.error("Error fetching profile:", error);
      return []; // Return an empty array or handle the error as needed
    })
  ).subscribe({
    next: (resp: any) => {
      console.log("API response:", resp);
      if (resp?.data && Array.isArray(resp.data) && resp.data.length > 0) {
        this.profile = resp.data[0];
        this.username = this.profile.username || '';
        console.log("Profile data:", this.profile);
      } else if (resp?.payload && Array.isArray(resp.payload) && resp.payload.length > 0) {
        this.profile = resp.payload[0];
        this.username = this.profile.username || '';
        console.log("Profile data:", this.profile);
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
        this.router.navigate(['/admin_login']);
      });
    }
  });
}
}
