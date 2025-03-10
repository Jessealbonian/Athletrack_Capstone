import { Component } from '@angular/core';
import { NavbarComponent } from '../navbar/navbar.component';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { HttpClient } from '@angular/common/http';
import { PropertyService } from '../../HOA/property-list/property.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

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
}

@Component({
  selector: 'app-properties',
  imports: [NavbarComponent, SidenavComponent, FormsModule, CommonModule],
  templateUrl: './properties.component.html',
  styleUrl: './properties.component.css'
})
export class PropertiesComponent {
  properties: Property[] = [];
  filteredProperties: Property[] = [];
  isNavOpen = true;
  selectedImage: File | null = null;
  isLoading = false;
  selectedProperty: any = null;
  

  activeFilter: string = '';
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
  
    // Handle file selection
    onFileSelected(event: any) {
      this.selectedImage = event.target.files[0]; // Get the selected file
    }

    showPropertyDetails(property: any) {
      this.selectedProperty = property;
    }
  

    
}
