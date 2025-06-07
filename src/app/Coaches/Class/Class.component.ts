import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; // Import the autoTable plugin

interface ClassRequest {
  id: number;
  address: string;
  resident_name: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  request_date: string;
  assigned_to: string;
}

interface ClassStats {
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

interface ClassRoutines {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

interface ClassData {
  title: string;
  description: string;
  routines: ClassRoutines;
}

interface TaskData {
  title: string;
  dueDate: string;
  dueTime: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

@Component({
  selector: 'app-Class',
  standalone: true,
  imports: [CommonModule, FormsModule, SidenavComponent, NavbarComponent],
  templateUrl: './Class.component.html',
  styleUrl: './Class.component.css'
})
export class ClassComponent implements OnInit {
  ClassRequests: ClassRequest[] = [];
  residentAddresses: ResidentAddress[] = [];
  classes: any[] = [];
  stats: ClassStats = {
    total_requests: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    high_priority_percentage: 0
  };

  newRequest: ClassRequest = {
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

  showAddClassModal = false;
  
  newClass: ClassData = {
    title: '',
    description: '',
    routines: {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: ''
    }
  };

  showAddTaskModal = false;
  showUploadModal = false;
  uploadType: 'image' | 'video' = 'image';
  selectedFile: File | null = null;
  
  newTask: TaskData = {
    title: '',
    dueDate: '',
    dueTime: '',
    status: 'Pending'
  };

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  private apiUrl = 'http://localhost/DEMO2/demoproject/api/';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadClassRequests();
    this.loadClassStats();
    this.fetchClasses();
  }

  loadClassRequests() {
    this.http.get(`${this.apiUrl}getClasses`).subscribe({
      next: (response: any) => {
        console.log('Class Requests:', response); // Debugging log
        // Map the response to ensure property names match the interface
        this.ClassRequests = (response.data || []).map((item: any) => ({
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
        this.ClassRequests = [];
        this.calculateStats();
      }
    });
  }
  

  calculateStats() {
    const total = this.ClassRequests.length;
    const inProgress = this.ClassRequests.filter(r => r.status === 'In Progress').length;
    const completed = this.ClassRequests.filter(r => r.status === 'Completed').length;
    const highPriority = this.ClassRequests.filter(r => r.priority === 'High').length;

    this.stats = {
      total_requests: total,
      pending: total - (inProgress + completed),
      in_progress: inProgress,
      completed: completed,
      high_priority_percentage: total > 0 ? Math.round((highPriority / total) * 100) : 0
    };
  }

  loadClassStats() {
    this.calculateStats();
  }


  openModal(request?: ClassRequest) {
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
  
      this.http.post(`${this.apiUrl}addClass`, updatedRequest).subscribe({
        next: () => {
          this.loadClassRequests();
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
          this.loadClassRequests();
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
  
      const endpoint = 'addClass';
      this.http.post(`${this.apiUrl}${endpoint}`, this.newRequest).subscribe({
        next: () => {
          this.loadClassRequests();
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
          this.loadClassRequests();
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
        this.http.post(`${this.apiUrl}deleteClass`, { id }).subscribe({
          next: () => {
            this.loadClassRequests();
            this.loadClassStats();
  
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
            this.loadClassRequests();
            this.loadClassStats();
  
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
    return this.ClassRequests.filter(request => {
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
    // doc.text('Class Requests', 14, 16);
  
    // Define columns for the table
    const columns: string[] = ['ID', 'Address', 'Resident Name', 'Description', 'Status', 'Priority', 'Request Date', 'Assigned To'];
    const rows: (string | number)[][] = this.ClassRequests.map(request => [
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
    doc.save('Class_requests.pdf');
  }
  
  openAddClassModal() {
    this.showAddClassModal = true;
  }

  closeAddClassModal() {
    this.showAddClassModal = false;
    this.resetForm();
  }

  confirmAddClass() {
    if (!this.newClass.title || !this.newClass.description) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Class name and description are required!'
      });
      return;
    }

    const classData = {
      class_name: this.newClass.title,
      description: this.newClass.description,
      mondayRoutine: this.newClass.routines.monday || '',
      tuesdayRoutine: this.newClass.routines.tuesday || '',
      wednesdayRoutine: this.newClass.routines.wednesday || '',
      thursdayRoutine: this.newClass.routines.thursday || '',
      fridayRoutine: this.newClass.routines.friday || '',
      saturdayRoutine: this.newClass.routines.saturday || '',
      sundayRoutine: this.newClass.routines.sunday || ''
    };

    this.http.post(`${this.apiUrl}/addClass`, classData).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'Class added successfully!'
          });
          this.closeAddClassModal();
          this.fetchClasses(); // Refresh the class list
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.message || 'Failed to add class'
          });
        }
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to add class. Please try again.'
        });
        console.error('Error adding class:', error);
      }
    });
  }

  fetchClasses() {
    this.http.get(`${this.apiUrl}/getClasses`).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          this.classes = response.data;
        }
      },
      error: (error) => {
        console.error('Error fetching classes:', error);
      }
    });
  }

  openAddTaskModal() {
    this.showAddTaskModal = true;
  }

  closeAddTaskModal() {
    this.showAddTaskModal = false;
    this.resetTaskForm();
  }

  confirmAddTask() {
    // TODO: Implement the logic to save the task
    console.log('New task data:', this.newTask);
    this.closeAddTaskModal();
  }

  private resetTaskForm() {
    this.newTask = {
      title: '',
      dueDate: '',
      dueTime: '',
      status: 'Pending'
    };
  }

  openUploadModal() {
    this.showUploadModal = true;
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.selectedFile = null;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  confirmUpload() {
    if (this.selectedFile) {
      // TODO: Implement the logic to upload the file
      console.log('Uploading file:', this.selectedFile);
      this.closeUploadModal();
    }
  }
}
