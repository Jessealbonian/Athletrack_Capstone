import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
// import { Property, ApiResponse } from './property.model'; // Import ApiResponse here
import { SidenavComponent } from '../sidenav/sidenav.component'; // Import SidenavComponent
import { NavbarComponent } from '../navbar/navbar.component'; // Import NavbarComponent
import Swal from 'sweetalert2';
import { PropertyService } from './property.service';


interface Property {
  id: number;
  type: 'house-and-lot' | 'empty-lot';
  prop_name: string;
  prop_address: string;
  prop_rooms: string;
  prop_baths: string;
  image: string;
  location: string;
  details: string;
  prop_status: string;
  prop_price: string;
  area?: string;
  prop_size: number; // Define the property size (in square meters)
}

@Component({
  selector: 'app-property-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SidenavComponent, NavbarComponent],
  templateUrl: './property-list.component.html',
  styleUrls: ['./property-list.component.css']
})
export class PropertyListComponent implements OnInit {
  properties: Property[] = [];
  filteredProperties: Property[] = [];
  isNavOpen = true;
  showAddModal = false;
  showEditModal = false; // New modal for editing
  showSuccessMessage = false;
  isLoading = false;
 
  // newProperty: Property = {
  //   image: '', // This will be handled differently now
  //   property_type: '',
  //   address: '',
  //   square_footage: '',
  //   bedrooms: 0,
  //   bathrooms: 0,
  //   year_built: 0,
  //   monthly_fee: 0,
  //   prop_price: 0,
  //   status: 'For Sale',
  // };
  activeFilter: string = '';
  selectedProperty: Property | null = null;
  selectedImage: File | null = null; // To hold the selected image file
  allProperties: Property[] = [];


  constructor(private http: HttpClient, private propertyService: PropertyService) {}

  ngOnInit() {
    this.fetchProperties();
  }

  fetchProperties() {
    this.propertyService.getProperties().subscribe(
      (response: any) => {
        // Filter out properties with status "Rented" and "Maintenance"
        this.allProperties = response.payload.filter((property: Property) => 
          property.prop_status !== 'Rented' && property.prop_status !== 'Maintenance'
        );
        this.filteredProperties = [...this.allProperties];
        this.properties = this.filteredProperties;
      },
      (error: any) => {
        console.error('Error fetching properties:', error);
      }
    );
  }

  filterProperty(status: string) {
    this.activeFilter = status;
    this.filteredProperties = this.properties.filter(property => 
      status === '' || property.prop_status === status
    );
  }

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  openAddModal() {
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    // this.resetForm();
  }

  // Handle file selection
  onFileSelected(event: any) {
    this.selectedImage = event.target.files[0]; // Get the selected file
  }
  showPropertyDetails(property: any) {
    this.selectedProperty = property;
  }

  // addProperty() {
  //   const formData = new FormData();
  //   formData.append('image', this.selectedImage!); // Append the image file
  //   formData.append('name', this.newProperty.property_type); // Assuming you want to use property_type as name
  //   formData.append('address', this.newProperty.address);
  //   formData.append('size', this.newProperty.square_footage);
  //   formData.append('rooms', this.newProperty.bedrooms.toString());
  //   formData.append('baths', this.newProperty.bathrooms.toString());
  //   formData.append('status', this.newProperty.status);
  //   formData.append('price', this.newProperty.prop_price.toString());
  //   formData.append('year_built', this.newProperty.year_built.toString());
  //   formData.append('monthly_fee', this.newProperty.monthly_fee.toString());

  //   this.http.post<ApiResponse>('http://localhost/demoproj1/api/modules/post.php?action=addProperty', formData)
  //     .subscribe({
  //       next: (response) => {
  //         // Show success message regardless of the response status
  //         Swal.fire({
  //           title: 'Success!',
  //           text: 'Property added successfully!',
  //           icon: 'success',
  //           timer: 2000,
  //           showConfirmButton: false
  //         });
  //         this.closeAddModal(); // Close the modal after adding
  //         this.fetchProperties(); // Refresh the property list
  //       },
  //       error: (error) => {
  //         console.error('Error adding property:', error);
  //         // Show success message even on error
  //         Swal.fire({
  //           title: 'Success!',
  //           text: 'Property added successfully!',
  //           icon: 'success',
  //           timer: 2000,
  //           showConfirmButton: false
  //         });
  //         this.closeAddModal(); // Close the modal even if there's an error
  //         this.fetchProperties(); // Refresh the property list
  //       }
  //     });
  // }

  // resetForm() {
  //   this.newProperty = {
  //     image: '',
  //     property_type: '',
  //     address: '',
  //     square_footage: '',
  //     bedrooms: 0,
  //     bathrooms: 0,
  //     year_built: 0,
  //     monthly_fee: 0,
  //     prop_price: 0,
  //     status: 'For Sale',
  //   };
  //   this.selectedImage = null; // Reset the selected image
  // }

  openModal(property: Property) {
    this.selectedProperty = property; // Set the selected property for viewing details
    console.log('Opening modal for property:', property);
    // Logic to display the modal can be added here if you have a modal component
  }

  openEditModal(property: Property) {
    this.selectedProperty = { ...property }; // Create a copy of the property for editing
    this.showEditModal = true; // Show the edit modal
    this.selectedProperty = null; // Clear selectedProperty to prevent detail modal from showing
  }

  closeEditModal() {
    this.showEditModal = false; // Close the edit modal
    this.selectedProperty = null; // Clear the selected property
  }

  // editProperty() {
  //   if (this.selectedProperty) {
  //       console.log('Editing property:', this.selectedProperty);
  //       // Here you would typically send a request to your API to update the property
  //       Swal.fire({
  //           title: 'Success!',
  //           text: 'Property updated successfully!',
  //           icon: 'success',
  //           timer: 2000,
  //           showConfirmButton: false
  //       });
  //       this.closeEditModal(); // Close the edit modal after updating
  //   } else {
  //       console.error('No property selected for editing.');
  //   }
  // }
}