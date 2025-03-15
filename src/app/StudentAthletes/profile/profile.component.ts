import { Component } from '@angular/core';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  imports: [SidenavComponent,NavbarComponent,CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {

  userId: number = 0;
  profile: any;
  name:  any;

  toggleEdit() {
    document.getElementById('editForm')?.classList.toggle('hidden');
  }

  toggleEditDetails() {
    document.getElementById('editDetailsForm')?.classList.toggle('hidden');
  }

  isNavOpen = true;

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }
  constructor(private auth: AuthService, private http: HttpClient) {}

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
    const url = `http://localhost/DEMO2/demoproject/api/getHoaUserProf/${userId}`;
    this.http.get(url).subscribe({
      next: (resp: any) => {
        console.log("API response:", resp);
        if (resp?.data && Array.isArray(resp.data) && resp.data.length > 0) {
          this.profile = resp.data[0];
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
  }
  

