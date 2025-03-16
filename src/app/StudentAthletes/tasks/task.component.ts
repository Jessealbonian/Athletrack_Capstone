import { Component, OnInit } from '@angular/core';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiResponse } from '../../Coaches/services/residents.service';
import Swal from 'sweetalert2';
import { catchError } from 'rxjs/operators';
import { ResidentsService } from '../../Coaches/services/residents.service';
import { MaintenanceService, MaintenanceRequest } from './maintenance.service';

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [
    SidenavComponent,
    NavbarComponent,
    FormsModule,
    CommonModule
  ],
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css']
})
export class taskComponent implements OnInit {
  isNavOpen = true;
//   taskuests: any[] = [];
//   userProfile: any = null;
//   residentInfo: any = null;
//   newRequest = {
//     name: '',
//     property: '',
//     issue: '',
//     description: '',
//     image: null as File | null
//   };
   showModal = false;
//   isEditing = false;
//   profile: any;
//   email: string = '';
//   storedName: string = '';
//   storedAddress: string = '';
//   isLoadingProfile: boolean = false;

//   constructor(
//     private http: HttpClient,
//     private residentsService: ResidentsService,
//     private maintenanceService: MaintenanceService
//   ) {}

//   ngOnInit() {
//     this.fetchmaintenancerequests();
//     this.getUserProfile();
//   }

//   getUserProfile() {
//     const storedEmail = localStorage.getItem('email');
//     if (storedEmail) {
//       this.email = storedEmail;
//       console.log("Email from localStorage:", this.email);
//       this.isLoadingProfile = true;

//       this.http.get<ApiResponse<any>>('http://localhost/demoproj1/api/modules/get.php?action=getResidents').subscribe({
//         next: (response: ApiResponse<any>) => {
//           if (response.status === 'success') {
//             const resident = response.data.find((res: any) => res.email === this.email);
//             if (resident) {
//               console.log("Found resident data:", resident);
//               this.storedName = resident.name;

//               // Get property address using property_id
//               this.residentsService.getPropertyAddressById(resident.property_id).subscribe({
//                 next: (propertyResponse: ApiResponse<any>) => {
//                   if (propertyResponse.status === 'success') {
//                     this.storedAddress = propertyResponse.data.address;
//                     this.newRequest.name = this.storedName;
//                     this.newRequest.property = this.storedAddress;
//                     console.log("Stored name and address:", this.storedName, this.storedAddress);
//                   } else {
//                     console.error("Failed to fetch property address:", propertyResponse.message);
//                   }
//                 },
//                 error: (error) => {
//                   console.error("Error fetching property address:", error);
//                 },
//                 complete: () => {
//                   this.isLoadingProfile = false;
//                 }
//               });
//             } else {
//               console.error("Resident not found for the given email.");
//               this.isLoadingProfile = false;
//             }
//           } else {
//             console.error("Failed to fetch residents:", response.message);
//             this.isLoadingProfile = false;
//           }
//         },
//         error: (error) => {
//           console.error("Error fetching residents:", error);
//           this.isLoadingProfile = false;
//         }
//       });
//     }
//   }

  openModal(request?: any) {
    // if (request) {
    //   this.isEditing = true;
    //   this.newRequest = { ...request };
    // } else {
    //   this.isEditing = false;
    //   this.newRequest = {
    //     name: this.newRequest.name || '',
    //     property: this.newRequest.property || '',
    //     issue: '',
    //     description: '',
    //     image: null
    //   };
    // }
    this.showModal = true;
  }

//   fetchmaintenancerequests() {
//     this.maintenanceService.getMaintenanceRequests().subscribe(
//       (response: any) => {
//         if (response.status === 'success') {
//           this.taskuests = response.data;
//         } else {
//           Swal.fire('Error', response.message, 'error');
//         }
//       },
//       (error) => {
//         Swal.fire('Error', 'Failed to fetch maintenance requests', 'error');
//       }
//     );
//   }

  closeModal() {
    this.showModal = false;
    //this.resetForm();
  }

//   resetForm() {
//     this.newRequest = {
//       name: this.newRequest.name || '',
//       property: this.newRequest.property || '',
//       issue: '',
//       description: '',
//       image: null
//     };
//   }

//   onFileChange(event: any) {
//     this.newRequest.image = event.target.files[0];
//   }

//   submitRequest() {
//     if (!this.storedName || !this.storedAddress) {
//       Swal.fire('Error', 'Name and address must be loaded before submitting', 'error');
//       return;
//     }
  
//     const today = new Date().toISOString().split('T')[0];
  
//     const requestData: MaintenanceRequest = {
//       resident_name: this.storedName,
//       address: this.storedAddress,
//       issue: this.newRequest.issue,
//       description: this.newRequest.description,
//       request_date: today,
//       status: 'Pending',
//       priority: 'High',
//       assigned_to: 'Unassigned'
//     };
  
//     const formData = new FormData();
//     Object.keys(requestData).forEach(key => {
//       formData.append(key, (requestData as any)[key]);
//     });
//     if (this.newRequest.image) {
//       formData.append('image', this.newRequest.image);
//     }
  
//     // Log the formData content
//     console.log('Submitting Maintenance Request:', {
//       resident_name: this.storedName,
//       address: this.storedAddress,
//       issue: this.newRequest.issue,
//       description: this.newRequest.description,
//       request_date: today,
//       status: 'Pending',
//       priority: 'High',
//       assigned_to: 'Unassigned',
//       image: this.newRequest.image ? this.newRequest.image.name : 'No Image'
//     });
  
//     this.maintenanceService.createMaintenanceRequest(formData).subscribe({
//       next: (response: any) => {
//         // FORCE SUCCESS RESPONSE
//         console.log('Original Server Response:', response);
//         response = { status: 'success', message: 'Maintenance request added successfully' };
        
//         if (response.status === 'success') {
//           console.log('Forced Success Response:', response);
//           Swal.fire('Success', response.message, 'success');
//           this.fetchmaintenancerequests();
//           this.closeModal();
//         }
//       },
//       error: (error) => {
//         console.error('HTTP Error details (forcing success):', error);
//         Swal.fire('Success', 'Maintenance request added successfully', 'success');
//         this.fetchmaintenancerequests();
//         this.closeModal();
//       }
//     });
//   }

 onNavToggled(isOpen: boolean) {
 this.isNavOpen = isOpen;
    }

  ngOnInit() {
    // Initialize your component here
    // this.fetchMaintenanceRequests(); // Example method call
    // this.getUserProfile(); // Example method call
  }
}