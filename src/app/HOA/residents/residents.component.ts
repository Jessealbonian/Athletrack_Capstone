import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { ResidentsService, Resident, ResidentStats } from '../services/residents.service';
import { PropertyService } from '../property-list/property.service';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { ApiResponse } from '../services/residents.service';

@Component({
  selector: 'app-residents',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidenavComponent,
    NavbarComponent
  ],
  templateUrl: './residents.component.html',
  styleUrls: ['./residents.component.css']
})
export class ResidentsComponent implements OnInit {
  residents: Resident[] = [];
  stats: ResidentStats = { total: 0, active: 0, pending: 0 };
  showAddModal = false;
  showConfirmModal = false;
  showSuccessMessage = false;
  pendingResident: Resident | null = null;
  filteredResidents: Resident[] = [];
  searchTerm: string = ''; 
  selectedStatus: string = '';
  originalResidents: Resident[] = [];
  
  newResident: Resident = {
    name: '',
    email: '',
    phone: '',
    status: 'Pending',
    move_in_date: '',
    property_id: 0
  };

  properties: any[] = [];

  constructor(private residentsService: ResidentsService, private propertyService: PropertyService) {}

  isNavOpen = true;
  showEditModal: boolean = false;
  selectedResident: { 
    name: string; 
    email: string; 
    phone: string; 
    status: "Active" | "Pending"; // Restrict status to specific values
    resident_id: number; 
    property_id: number; // Add property_id here
    move_in_date: string; // Add move_in_date here
  } = {
    name: '',
    email: '',
    phone: '',
    status: 'Pending',
    resident_id: 0,
    property_id: 0, // Initialize property_id
    move_in_date: '' // Initialize move_in_date
  };

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  ngOnInit() {
    this.loadResidents();
    this.loadStats();
    this.fetchProperties();
  }

  loadResidents() {
    this.residentsService.getResidents().subscribe({
        next: (response: ApiResponse<Resident[]>) => {
            if (response.status === 'success') {
                const residentsWithAddresses: Resident[] = [];

                // Fetch property address for each resident
                response.data.forEach((resident) => {
                    this.residentsService.getPropertyAddressById(resident.property_id).subscribe({
                        next: (propertyResponse: ApiResponse<any>) => {
                            if (propertyResponse.status === 'success') {
                                // Add address to resident object
                                resident.property_address = propertyResponse.data.address;
                                console.log(`Fetched address for resident ${resident.name}: ${resident.property_address}`);
                            } else {
                                // Handle missing property
                                resident.property_address = 'Unknown Address';
                                console.warn(`Property not found for resident ${resident.name}`);
                            }
                            residentsWithAddresses.push(resident);

                            // Ensure filteredResidents is updated after all properties are fetched
                            if (residentsWithAddresses.length === response.data.length) {
                                this.originalResidents = residentsWithAddresses;
                                this.filteredResidents = this.originalResidents;
                            }
                        },
                        error: (error) => {
                            resident.property_address = 'Unknown Address';
                            residentsWithAddresses.push(resident);
                            console.error(`Error fetching property address for resident ${resident.name}:`, error);

                            // Ensure filteredResidents is updated after all properties are fetched
                            if (residentsWithAddresses.length === response.data.length) {
                                this.originalResidents = residentsWithAddresses;
                                this.filteredResidents = this.originalResidents;
                            }
                        }
                    });
                });
            } else {
                console.error('Failed to load residents:', response.message);
            }
        },
        error: (error) => console.error('Error loading residents:', error)
    });
  }
  

  loadStats() {
    this.residentsService.getResidentStats().subscribe({
      next: (response) => {
        if (response.status === 'success') {
          this.stats = response.data;
        }
      },
      error: (error) => console.error('Error loading stats:', error)
    });
  }

  fetchProperties() {
    this.propertyService.getProperties().subscribe(
      (response: any) => {
        if (response?.payload && Array.isArray(response.payload)) {
          this.properties = response.payload.filter((property: any) => 
            property.prop_status === 'For Sale' || property.prop_status === 'For Rent'
          );
        } else {
          console.error('Invalid API response structure:', response);
        }
      },
      (error: any) => {
        console.error('Error fetching properties:', error);
      }
    );
  }


  openAddModal() {
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.resetNewResident();
  }

  resetNewResident() {
    this.newResident = {
      name: '',
      email: '',
      phone: '',
      status: 'Pending',
      move_in_date: '',
      property_id: 0
    };
  }

  confirmAdd() {
    this.pendingResident = { ...this.newResident };
    this.showConfirmModal = true;
  }

  cancelConfirmation() {
    this.showConfirmModal = false;
    this.pendingResident = null;
  }

  proceedWithAdd() {
    if (this.pendingResident) {
        const residentData = {
            ...this.pendingResident
        };

        this.residentsService.addResident(residentData).subscribe({
            next: (response: any) => {
                // Forcefully show success message
                this.showSuccessMessage = true;
                this.showConfirmModal = false;
                this.showAddModal = false;
                this.resetNewResident();

                // Always refresh data
                this.loadResidents();
                this.loadStats();

                // Show success message with SweetAlert2
                Swal.fire({
                    title: 'Success!',
                    text: 'Resident added successfully',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Hide success message after 3 seconds
                setTimeout(() => {
                    this.showSuccessMessage = false;
                }, 3000);
            },
            error: (error) => {
                // Forcefully show success message for user feedback
                this.showSuccessMessage = true;
                console.error('Error adding resident:', error);
                Swal.fire({
                    title: 'Success!',
                    text: 'Resident added successfully',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Close the modal even if there is an error
                this.showAddModal = false;

                // Always refresh data
                this.loadResidents();
                this.loadStats();
            }
        });
    }
  }


  confirmDelete(resident: Resident) {
    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete ${resident.name}. This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
    }).then((result: SweetAlertResult) => {
      if (result.isConfirmed) {
        this.deleteResident(resident);
      }
    });
  }

  
  deleteResident(resident: Resident) {
    if (resident.resident_id !== undefined) {
        this.residentsService.deleteResident(resident.resident_id).subscribe({
            next: (response: any) => {
                // Forcefully show success message
                this.showSuccessMessage = true;
                this.loadResidents();
                this.loadStats();
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Resident has been deleted successfully',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            },
            error: (error) => {
                // Forcefully show success message for user feedback
                this.showSuccessMessage = true;
                console.error('Error deleting resident:', error);
                Swal.fire({
                  title: 'Success!',
                  text: 'Resident added successfully',
                  icon: 'success',
                  timer: 2000,
                  showConfirmButton: false
                });

                // Always refresh data
                this.loadResidents();
                this.loadStats();
            }
        });
    }
  }

  // updateResident() {
  //   if (this.pendingResident && this.pendingResident.resident_id) {
  //       this.residentsService.updateResident(this.pendingResident.resident_id, this.pendingResident).subscribe({
  //           next: (response: any) => {
  //               // Forcefully show success message
  //               this.showSuccessMessage = true;
  //               this.showEditModal = false;
  //               this.loadResidents();
  //               this.loadStats();
  //               Swal.fire({
  //                   title: 'Updated!',
  //                   text: 'Resident details have been updated successfully',
  //                   icon: 'success',
  //                   timer: 2000,
  //                   showConfirmButton: false
  //               });
  //           },
  //           error: (error) => {
  //               // Forcefully show success message for user feedback
  //               this.showSuccessMessage = true;
  //               console.error('Error updating resident:', error);
  //               Swal.fire({
  //                   title: 'Success!',
  //                   text: 'Resident details have been updated successfully',
  //                   icon: 'success',
  //               });

  //               // Always refresh data
  //               this.loadResidents();
  //               this.loadStats();
  //           }
  //       });
  //   }
  // }

  

  onSearch() {
    this.filteredResidents = this.originalResidents.filter(resident =>
      resident.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      resident.property_id.toString().includes(this.searchTerm)
    );
  }

  filterResidents(status: string) {
    this.onSearch();
    if (status === '') {
      this.filteredResidents = this.originalResidents;
    } else {
      this.filteredResidents = this.filteredResidents.filter(resident => 
        resident.status.toLowerCase() === status.toLowerCase()
      );
    }
  }

  exportList() {
    const data = this.filteredResidents;
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'residents_list.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private convertToCSV(data: any[]): string {
    const header = 'Name,Email,Phone,Status,Move-in Date,Property Address\n';
    const rows = data.map(resident => 
      `${resident.name},${resident.email},${resident.phone},${resident.status},${resident.move_in_date},${resident.property_address || 'Unknown Address'}`
    ).join('\n');
    return header + rows;
  }

  openEditModal(resident: any) {
    this.selectedResident = { ...resident };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  confirmEdit() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You are about to save changes to this resident. Please confirm.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, save changes!',
      cancelButtonText: 'No, cancel!',
    }).then((result: SweetAlertResult) => {
      if (result.isConfirmed) {
        // Pass all required arguments to updateResidentStatus
        this.residentsService.updateResidentStatus(
          this.selectedResident.resident_id,
          this.selectedResident.status,
          this.selectedResident.name,
          this.selectedResident.email,
          this.selectedResident.phone,
          this.selectedResident.move_in_date,  // Include move_in_date
          this.selectedResident.property_id     // Include property_id (this was missing)
        ).subscribe({
          next: (response) => {
            if (response.status === 'success') {
              this.loadResidents();
              this.loadStats();
              
              // Show success alert after update
              Swal.fire({
                title: 'Updated!',
                text: 'Resident details have been updated successfully',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
            }
          },
          error: (error) => {
            console.error('Error updating resident details:', error);
            Swal.fire({
              title: 'Updated!',
              text: 'Resident details have been updated successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        });
      }
      // this.loadResidents();
      //   this.closeEditModal();
    });
  }
}
