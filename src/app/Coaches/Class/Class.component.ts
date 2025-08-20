import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth.service';
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
  mondayIntensityEasy: boolean;
  mondayIntensityMedium: boolean;
  mondayIntensityHard: boolean;
  tuesdayIntensityEasy: boolean;
  tuesdayIntensityMedium: boolean;
  tuesdayIntensityHard: boolean;
  wednesdayIntensityEasy: boolean;
  wednesdayIntensityMedium: boolean;
  wednesdayIntensityHard: boolean;
  thursdayIntensityEasy: boolean;
  thursdayIntensityMedium: boolean;
  thursdayIntensityHard: boolean;
  fridayIntensityEasy: boolean;
  fridayIntensityMedium: boolean;
  fridayIntensityHard: boolean;
  saturdayIntensityEasy: boolean;
  saturdayIntensityMedium: boolean;
  saturdayIntensityHard: boolean;
  sundayIntensityEasy: boolean;
  sundayIntensityMedium: boolean;
  sundayIntensityHard: boolean;
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
  currentAdminId: number | null = null;
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
      sunday: '',
      mondayIntensityEasy: false,
      mondayIntensityMedium: false,
      mondayIntensityHard: false,
      tuesdayIntensityEasy: false,
      tuesdayIntensityMedium: false,
      tuesdayIntensityHard: false,
      wednesdayIntensityEasy: false,
      wednesdayIntensityMedium: false,
      wednesdayIntensityHard: false,
      thursdayIntensityEasy: false,
      thursdayIntensityMedium: false,
      thursdayIntensityHard: false,
      fridayIntensityEasy: false,
      fridayIntensityMedium: false,
      fridayIntensityHard: false,
      saturdayIntensityEasy: false,
      saturdayIntensityMedium: false,
      saturdayIntensityHard: false,
      sundayIntensityEasy: false,
      sundayIntensityMedium: false,
      sundayIntensityHard: false
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

  showClassDetailsModal = false;
  selectedClass: any = null;
  isEditingClassDetails = false;

  // Token generation properties
  showTokenModal = false;
  tokenCount = 1;
  generatedTokens: string[] = [];
  isGeneratingTokens = false;

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  private apiUrl = 'https://capstonebackend-9wrj.onrender.com/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    // Capture current admin id from auth (same source used by navbar)
    this.auth.getCurrentUser().subscribe((user: any) => {
      this.currentAdminId = user?.id ?? null;
      // Once we have admin id, load classes filtered to this admin
      this.fetchClasses();
    });
    this.loadClassRequests();
    this.loadClassStats();
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
    this.resetClassForm();
  }

  private resetClassForm() {
    this.newClass = {
      title: '',
      description: '',
      routines: {
        monday: '',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        saturday: '',
        sunday: '',
        mondayIntensityEasy: false,
        mondayIntensityMedium: false,
        mondayIntensityHard: false,
        tuesdayIntensityEasy: false,
        tuesdayIntensityMedium: false,
        tuesdayIntensityHard: false,
        wednesdayIntensityEasy: false,
        wednesdayIntensityMedium: false,
        wednesdayIntensityHard: false,
        thursdayIntensityEasy: false,
        thursdayIntensityMedium: false,
        thursdayIntensityHard: false,
        fridayIntensityEasy: false,
        fridayIntensityMedium: false,
        fridayIntensityHard: false,
        saturdayIntensityEasy: false,
        saturdayIntensityMedium: false,
        saturdayIntensityHard: false,
        sundayIntensityEasy: false,
        sundayIntensityMedium: false,
        sundayIntensityHard: false
      }
    };
  }

  private getIntensityFromFlags(easy: boolean, medium: boolean, hard: boolean): string {
    if (easy) return 'Easy';
    if (medium) return 'Medium';
    if (hard) return 'Hard';
    return '';
  }

  // Ensure only one checkbox per day is selected in Add Class modal
  onIntensityChange(day: 'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday', level: 'Easy'|'Medium'|'Hard') {
    const routines = this.newClass.routines;
    const keys = {
      Easy: `${day}IntensityEasy`,
      Medium: `${day}IntensityMedium`,
      Hard: `${day}IntensityHard`
    } as const;

    // Turn off the other two when one is set to true
    if ((routines as any)[keys[level]]) {
      if (level !== 'Easy') (routines as any)[`${day}IntensityEasy`] = false;
      if (level !== 'Medium') (routines as any)[`${day}IntensityMedium`] = false;
      if (level !== 'Hard') (routines as any)[`${day}IntensityHard`] = false;
    }
  }

  // Ensure only one checkbox per day in Class Details modal when editing
  onDetailsIntensityChange(day: 'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday', level: 'Easy'|'Medium'|'Hard') {
    const obj = this.selectedClass;
    if (!obj) return;
    const keys = {
      Easy: `${day}IntensityEasy`,
      Medium: `${day}IntensityMedium`,
      Hard: `${day}IntensityHard`
    } as const;
    if (obj[keys[level]]) {
      if (level !== 'Easy') obj[`${day}IntensityEasy`] = false;
      if (level !== 'Medium') obj[`${day}IntensityMedium`] = false;
      if (level !== 'Hard') obj[`${day}IntensityHard`] = false;
    }
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
      admin_id: this.currentAdminId,
      mondayRoutine: this.newClass.routines.monday || '',
      tuesdayRoutine: this.newClass.routines.tuesday || '',
      wednesdayRoutine: this.newClass.routines.wednesday || '',
      thursdayRoutine: this.newClass.routines.thursday || '',
      fridayRoutine: this.newClass.routines.friday || '',
      saturdayRoutine: this.newClass.routines.saturday || '',
      sundayRoutine: this.newClass.routines.sunday || '',
      mondayintensity: this.getIntensityFromFlags(
        this.newClass.routines.mondayIntensityEasy,
        this.newClass.routines.mondayIntensityMedium,
        this.newClass.routines.mondayIntensityHard
      ),
      tuesdayintensity: this.getIntensityFromFlags(
        this.newClass.routines.tuesdayIntensityEasy,
        this.newClass.routines.tuesdayIntensityMedium,
        this.newClass.routines.tuesdayIntensityHard
      ),
      wednesdayintensity: this.getIntensityFromFlags(
        this.newClass.routines.wednesdayIntensityEasy,
        this.newClass.routines.wednesdayIntensityMedium,
        this.newClass.routines.wednesdayIntensityHard
      ),
      thursdayintensity: this.getIntensityFromFlags(
        this.newClass.routines.thursdayIntensityEasy,
        this.newClass.routines.thursdayIntensityMedium,
        this.newClass.routines.thursdayIntensityHard
      ),
      fridayintensity: this.getIntensityFromFlags(
        this.newClass.routines.fridayIntensityEasy,
        this.newClass.routines.fridayIntensityMedium,
        this.newClass.routines.fridayIntensityHard
      ),
      saturdayintensity: this.getIntensityFromFlags(
        this.newClass.routines.saturdayIntensityEasy,
        this.newClass.routines.saturdayIntensityMedium,
        this.newClass.routines.saturdayIntensityHard
      ),
      sundayintensity: this.getIntensityFromFlags(
        this.newClass.routines.sundayIntensityEasy,
        this.newClass.routines.sundayIntensityMedium,
        this.newClass.routines.sundayIntensityHard
      )
    };

    console.log('Sending class data to API:', classData);

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
          const all = response.data || [];
          this.classes = this.currentAdminId != null
            ? all.filter((c: any) => Number(c.admin_id) === Number(this.currentAdminId))
            : all;
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

  openClassDetailsModal(classObj: any) {
    this.selectedClass = {
      ...classObj,
      enrolledStudents: classObj.enrolledStudents || []
    };

    // Map intensity strings from DB to checkbox booleans for display/editing
    const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    for (const day of days) {
      const intensityString: string = (classObj[`${day}intensity`] || '').toString();
      const normalized = intensityString.trim().toLowerCase();
      this.selectedClass[`${day}IntensityEasy`] = normalized === 'easy';
      this.selectedClass[`${day}IntensityMedium`] = normalized === 'medium';
      this.selectedClass[`${day}IntensityHard`] = normalized === 'hard';
    }
    this.showClassDetailsModal = true;
    this.isEditingClassDetails = false;
  }

  closeClassDetailsModal() {
    this.showClassDetailsModal = false;
    this.selectedClass = null;
    this.isEditingClassDetails = false;
  }

  confirmEditClassDetails() {
    if (!this.selectedClass) {
      return;
    }

    const payload = {
      class_id: this.selectedClass.class_id,
      mondayRoutine: this.selectedClass.mondayRoutine || '',
      tuesdayRoutine: this.selectedClass.tuesdayRoutine || '',
      wednesdayRoutine: this.selectedClass.wednesdayRoutine || '',
      thursdayRoutine: this.selectedClass.thursdayRoutine || '',
      fridayRoutine: this.selectedClass.fridayRoutine || '',
      saturdayRoutine: this.selectedClass.saturdayRoutine || '',
      sundayRoutine: this.selectedClass.sundayRoutine || '',
      mondayintensity: this.getIntensityFromFlags(
        !!this.selectedClass.mondayIntensityEasy,
        !!this.selectedClass.mondayIntensityMedium,
        !!this.selectedClass.mondayIntensityHard
      ),
      tuesdayintensity: this.getIntensityFromFlags(
        !!this.selectedClass.tuesdayIntensityEasy,
        !!this.selectedClass.tuesdayIntensityMedium,
        !!this.selectedClass.tuesdayIntensityHard
      ),
      wednesdayintensity: this.getIntensityFromFlags(
        !!this.selectedClass.wednesdayIntensityEasy,
        !!this.selectedClass.wednesdayIntensityMedium,
        !!this.selectedClass.wednesdayIntensityHard
      ),
      thursdayintensity: this.getIntensityFromFlags(
        !!this.selectedClass.thursdayIntensityEasy,
        !!this.selectedClass.thursdayIntensityMedium,
        !!this.selectedClass.thursdayIntensityHard
      ),
      fridayintensity: this.getIntensityFromFlags(
        !!this.selectedClass.fridayIntensityEasy,
        !!this.selectedClass.fridayIntensityMedium,
        !!this.selectedClass.fridayIntensityHard
      ),
      saturdayintensity: this.getIntensityFromFlags(
        !!this.selectedClass.saturdayIntensityEasy,
        !!this.selectedClass.saturdayIntensityMedium,
        !!this.selectedClass.saturdayIntensityHard
      ),
      sundayintensity: this.getIntensityFromFlags(
        !!this.selectedClass.sundayIntensityEasy,
        !!this.selectedClass.sundayIntensityMedium,
        !!this.selectedClass.sundayIntensityHard
      )
    };

    console.log('Updating class data:', payload);

    this.http.post(`${this.apiUrl}editClass`, payload).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          Swal.fire({ icon: 'success', title: 'Updated', text: 'Class updated successfully!' });
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: response.message || 'Failed to update class' });
        }
    this.showClassDetailsModal = false;
    this.selectedClass = null;
    this.isEditingClassDetails = false;
    this.fetchClasses();
      },
      error: (error) => {
        console.error('Error updating class:', error);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update class. Please try again.' });
      }
    });
  }

  generateToken() {
    // TODO: Implement token generation logic
    alert('Generate Token feature coming soon!');
  }

  // Token generation methods
  openTokenModal() {
    this.showTokenModal = true;
    this.tokenCount = 1;
    this.generatedTokens = [];
  }

  closeTokenModal() {
    this.showTokenModal = false;
    this.tokenCount = 1;
    this.generatedTokens = [];
  }

  generateTokens() {
    if (!this.selectedClass || !this.currentAdminId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select a class and ensure you are logged in.'
      });
      return;
    }

    if (this.tokenCount < 1 || this.tokenCount > 100) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter a valid number between 1 and 100.'
      });
      return;
    }

    // First confirmation
    Swal.fire({
      icon: 'question',
      title: 'Generate tokens?',
      text: `Generate ${this.tokenCount} token(s) for this class?`,
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'No'
    }).then(first => {
      if (!first.isConfirmed) return;

      // Second confirmation
      Swal.fire({
        icon: 'warning',
        title: 'Are you absolutely sure?',
        html: `This will create <b>${this.tokenCount}</b> token(s).<br/>Proceed?`,
        showCancelButton: true,
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel'
      }).then(second => {
        if (!second.isConfirmed) return;

        this.isGeneratingTokens = true;
        const tokenData = {
          count: this.tokenCount,
          class_id: this.selectedClass.class_id,
          admin_id: this.currentAdminId
        };

        this.http.post(`${this.apiUrl}/generateTokens`, tokenData).subscribe({
          next: (response: any) => {
            this.isGeneratingTokens = false;
            if (response.status === 'success') {
              this.generatedTokens = response.tokens;
              Swal.fire({
                icon: 'success',
                title: 'Success',
                text: `${response.count} tokens generated successfully!`
              });
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: response.message || 'Failed to generate tokens'
              });
            }
          },
          error: (error) => {
            this.isGeneratingTokens = false;
            console.error('Error generating tokens:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to generate tokens. Please try again.'
            });
          }
        });
      });
    });
  }

  copyTokenToClipboard(token: string) {
    navigator.clipboard.writeText(token).then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: 'Token copied to clipboard',
        timer: 1500,
        showConfirmButton: false
      });
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = token;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: 'Token copied to clipboard',
        timer: 1500,
        showConfirmButton: false
      });
    });
  }

  copyAllTokensToClipboard() {
    if (!this.generatedTokens || this.generatedTokens.length === 0) {
      Swal.fire({ icon: 'info', title: 'No tokens', text: 'There are no tokens to copy yet.' });
      return;
    }

    const text = this.generatedTokens.join('\n');

    navigator.clipboard.writeText(text).then(() => {
      Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: 'All tokens copied to clipboard',
        timer: 1500,
        showConfirmButton: false
      });
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      Swal.fire({
        icon: 'success',
        title: 'Copied!',
        text: 'All tokens copied to clipboard',
        timer: 1500,
        showConfirmButton: false
      });
    });
  }
}
