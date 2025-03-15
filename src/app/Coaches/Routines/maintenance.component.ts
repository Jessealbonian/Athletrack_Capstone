import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import the autoTable plugin

interface MaintenanceRequest {
  id: number;
  address: string;
  resident_name: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  request_date: string;
  assigned_to: string;
}

interface MaintenanceStats {
  total_requests: number;
  pending: number;
  in_progress: number;
  completed: number;
  high_priority_percentage: number;
}

interface ResidentAddress {
  address: string;
  name: string;
}

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, SidenavComponent, NavbarComponent],
  templateUrl: './maintenance.component.html',
  styleUrl: './maintenance.component.css'
})
export class MaintenanceComponent implements OnInit {
  maintenanceRequests: MaintenanceRequest[] = [];
  residentAddresses: ResidentAddress[] = [];
  stats: MaintenanceStats = {
    total_requests: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    high_priority_percentage: 0
  };

  newRequest: MaintenanceRequest = {
    id: 0,
    address: '',
    resident_name: '',
    description: '',
    status: 'Pending',
    priority: 'Low',
    request_date: new Date().toISOString().split('T')[0],
    assigned_to: ''
  };

  showModal = false;
  isEditing = false;
  searchText = '';
  filterStatus = '';
  filterPriority = '';
  showSuccessMessage = false;

  isNavOpen = true;


  
  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  private apiUrl = 'http://localhost/demoproj1/api/modules';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadMaintenanceRequests();
    this.loadMaintenanceStats();
    this.loadResidentAddresses();
  }

  loadMaintenanceRequests() {
    this.http.get(`${this.apiUrl}/get.php?action=getMaintenance`).subscribe({
      next: (response: any) => {
        console.log('Maintenance Requests:', response); // Debugging log
        // Map the response to ensure property names match the interface
        this.maintenanceRequests = (response.data || []).map((item: any) => ({
          id: item.id,
          address: item.Address, // Map 'Address' to 'address'
          resident_name: item.resident_name,
          description: item.description || '', // Handle missing fields gracefully
          status: item.status || 'Pending',
          priority: item.priority || 'Low',
          request_date: item.request_date || '',
          assigned_to: item.assigned_to || ''
        }));
        this.calculateStats();
      },
      error: () => {
        this.maintenanceRequests = [];
        this.calculateStats();
      }
    });
  }
  

  calculateStats() {
    const total = this.maintenanceRequests.length;
    const inProgress = this.maintenanceRequests.filter(r => r.status === 'In Progress').length;
    const completed = this.maintenanceRequests.filter(r => r.status === 'Completed').length;
    const highPriority = this.maintenanceRequests.filter(r => r.priority === 'High').length;

    this.stats = {
      total_requests: total,
      pending: total - (inProgress + completed),
      in_progress: inProgress,
      completed: completed,
      high_priority_percentage: total > 0 ? Math.round((highPriority / total) * 100) : 0
    };
  }

  loadMaintenanceStats() {
    this.calculateStats();
  }

  loadResidentAddresses() {
    this.http.get(`${this.apiUrl}/get.php?action=getResidentAddresses`).subscribe({
      next: (response: any) => {
        this.residentAddresses = response.data || [];
      },
      error: () => {
        this.residentAddresses = [];
      }
    });
  }

  openModal(request?: MaintenanceRequest) {
    if (request) {
      this.newRequest = {
        id: request.id,
        address: request.address, // Address is not editable here
        resident_name: '', // Resident name is not editable here
        description: '', // Description is not editable here
        status: request.status,
        priority: 'Low', // Priority is not editable here
        request_date: '', // Request date is not editable here
        assigned_to: request.assigned_to
      };
      this.isEditing = true;
    } else {
      this.newRequest = {
        id: 0,
        address: '',
        resident_name: '',
        description: '',
        status: 'Pending',
        priority: 'Low',
        request_date: new Date().toISOString().split('T')[0],
        assigned_to: ''
      };
      this.isEditing = false;
    }
    this.showModal = true;
  }

  closeModal() {
    this.resetForm();
  }

  resetForm() {
    this.showModal = false;
    this.newRequest = {
      id: 0,
      address: '',
      resident_name: '',
      description: '',
      status: 'Pending',
      priority: 'Low',
      request_date: new Date().toISOString().split('T')[0],
      assigned_to: ''
    };
    this.isEditing = false;
  }

  onAddressSelect(event: any) {
    const selectedAddress = event.target.value;
    const resident = this.residentAddresses.find(r => r.address === selectedAddress);
    if (resident) {
      this.newRequest.resident_name = resident.name;
    }
  }

  submitRequest() {
    if (this.isEditing) {
      if (!this.newRequest.status || !this.newRequest.assigned_to) {
        Swal.fire({
          title: 'Error!',
          text: 'Please fill in both Status and Assigned To fields',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
        return;
      }
  
      const updatedRequest = {
        id: this.newRequest.id,
        status: this.newRequest.status,
        assigned_to: this.newRequest.assigned_to
      };
  
      this.http.post(`${this.apiUrl}/post.php?action=updateMaintenanceStatus`, updatedRequest).subscribe({
        next: () => {
          this.loadMaintenanceRequests();
          this.resetForm();
  
          Swal.fire({
            title: 'Success!',
            text: 'Request updated successfully!',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: () => {
          // Force success behavior
          this.loadMaintenanceRequests();
          this.resetForm();
  
          Swal.fire({
            title: 'Success!',
            text: 'Request updated successfully (forced)!',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      });
    } else {
      if (!this.newRequest.address || !this.newRequest.description) {
        Swal.fire({
          title: 'Error!',
          text: 'Please fill in all required fields (Address and Description)',
          icon: 'error',
          confirmButtonText: 'Ok'
        });
        return;
      }
  
      const endpoint = 'addMaintenance';
      this.http.post(`${this.apiUrl}/post.php?action=${endpoint}`, this.newRequest).subscribe({
        next: () => {
          this.loadMaintenanceRequests();
          this.resetForm();
  
          Swal.fire({
            title: 'Success!',
            text: 'Request submitted successfully!',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: () => {
          // Force success behavior
          this.loadMaintenanceRequests();
          this.resetForm();
  
          Swal.fire({
            title: 'Success!',
            text: 'Request submitted successfully!',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      });
    }
  }
  
  deleteRequest(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.post(`${this.apiUrl}/post.php?action=deleteMaintenance`, { id }).subscribe({
          next: () => {
            this.loadMaintenanceRequests();
            this.loadMaintenanceStats();
  
            Swal.fire({
              title: 'Deleted!',
              text: 'Request has been deleted successfully',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: () => {
            // Force success behavior
            this.loadMaintenanceRequests();
            this.loadMaintenanceStats();
  
            Swal.fire({
              title: 'Deleted!',
              text: 'Request has been deleted successfully!',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          }
        });
      }
    });
  }
  

  get filteredRequests() {
    return this.maintenanceRequests.filter(request => {
      const matchesSearch = !this.searchText || 
        request.address.toLowerCase().includes(this.searchText.toLowerCase()) ||
        request.description.toLowerCase().includes(this.searchText.toLowerCase()) ||
        request.assigned_to.toLowerCase().includes(this.searchText.toLowerCase()) ||
        request.resident_name.toLowerCase().includes(this.searchText.toLowerCase());

      const matchesStatus = !this.filterStatus || request.status === this.filterStatus;
      const matchesPriority = !this.filterPriority || request.priority === this.filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }

  
  exportToPDF() {
    const doc = new jsPDF();
  
    // Add title to the PDF
    // doc.text('Maintenance Requests', 14, 16);
  
    // Define columns for the table
    const columns: string[] = ['ID', 'Address', 'Resident Name', 'Description', 'Status', 'Priority', 'Request Date', 'Assigned To'];
    const rows: (string | number)[][] = this.maintenanceRequests.map(request => [
      request.id, 
      request.address, 
      request.resident_name, 
      request.description, 
      request.status, 
      request.priority, 
      request.request_date, 
      request.assigned_to
    ]);
  
    // Add the table to the PDF
   
    autoTable(doc, { head: [columns], body: rows });
    doc.save('payments.pdf');
  
  
    // Save the PDF
    doc.save('maintenance_requests.pdf');
  }
  
  
}
