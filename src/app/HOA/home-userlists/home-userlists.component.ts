import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home-userlists',
  imports: [NavbarComponent, SidenavComponent, FormsModule, CommonModule],
  templateUrl: './home-userlists.component.html',
  styleUrl: './home-userlists.component.css'
})
export class HomeUserlistsComponent {

  constructor(
    private http: HttpClient
  ) {
    this.loadAddedEmails();
  }

  isNavOpen = false;
  sentEmail: any;
  successMessage: string = '';
  errorMessage: string = '';

  lastAddedEmail: string | null = null; 
  addedEmails: Set<string> = new Set<string>();

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  ngOnInit() {
    this.getSentEmail();
   }

   loadAddedEmails() {
    const storedEmails = localStorage.getItem('addedEmails');
    if (storedEmails) {
        this.addedEmails = new Set(JSON.parse(storedEmails));
    }
}

   getSentEmail() {
    this.http.get('http://localhost/DEMO2/demoproject/api/getTransferredEmails')
    .subscribe((resp: any) => {
      this.sentEmail = resp.payload;
      this.successMessage = "Sent emails fetched successfully!";
      this.errorMessage = ''; // Clear any previous error messages

      // Loop through each sent email and add it to the hoa_users table
      // this.sentEmail.forEach((email: any) => {
      //   this.addEmailToUsers(email);
      // });
    }, error => {
      this.errorMessage = "Failed to fetch sent emails.";
      this.successMessage = ''; // Clear any previous success messages
    });
  }

  addEmailToUsers(email: { email: string; username: string }) {
    // Fetch the password from the users table based on the email
    this.http.get(`http://localhost/DEMO2/demoproject/api/getUserPassword?email=${email.email}`)
    .subscribe((resp: any) => {
        if (resp && resp.password) {
            const data = {
                email: email.email,
                username: email.username,
                password: resp.password // Use the fetched password
            };

            this.http.post('http://localhost/DEMO2/demoproject/api/addUser', data)
            .subscribe((resp: any) => {
                this.successMessage = "User added: " + email.email;
                this.lastAddedEmail = email.email; // Set the last added email
                this.addedEmails.add(email.email); // Add to the set
                localStorage.setItem('addedEmails', JSON.stringify(Array.from(this.addedEmails))); // Save to local storage
            }, error => {
                this.errorMessage = "Error adding user: " + email.email;
            });
        } else {
            this.errorMessage = "Password not found for email: " + email.email;
        }
    }, error => {
        this.errorMessage = "Error fetching password for email: " + email.email;
    });
}

}
