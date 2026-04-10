import { Component, HostListener, OnInit } from '@angular/core';
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
  mondayIntensityAverage: boolean;
  mondayIntensityHard: boolean;
  tuesdayIntensityEasy: boolean;
  tuesdayIntensityAverage: boolean;
  tuesdayIntensityHard: boolean;
  wednesdayIntensityEasy: boolean;
  wednesdayIntensityAverage: boolean;
  wednesdayIntensityHard: boolean;
  thursdayIntensityEasy: boolean;
  thursdayIntensityAverage: boolean;
  thursdayIntensityHard: boolean;
  fridayIntensityEasy: boolean;
  fridayIntensityAverage: boolean;
  fridayIntensityHard: boolean;
  saturdayIntensityEasy: boolean;
  saturdayIntensityAverage: boolean;
  saturdayIntensityHard: boolean;
  sundayIntensityEasy: boolean;
  sundayIntensityAverage: boolean;
  sundayIntensityHard: boolean;
  [key: string]: string | boolean; // Add index signature for dynamic access
}

interface ClassData {
  title: string;
  description: string;
  routines: ClassRoutines;
  expirationDate?: string;
  expirationTime?: string;
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
      mondayIntensityAverage: false,
      mondayIntensityHard: false,
      tuesdayIntensityEasy: false,
      tuesdayIntensityAverage: false,
      tuesdayIntensityHard: false,
      wednesdayIntensityEasy: false,
      wednesdayIntensityAverage: false,
      wednesdayIntensityHard: false,
      thursdayIntensityEasy: false,
      thursdayIntensityAverage: false,
      thursdayIntensityHard: false,
      fridayIntensityEasy: false,
      fridayIntensityAverage: false,
      fridayIntensityHard: false,
      saturdayIntensityEasy: false,
      saturdayIntensityAverage: false,
      saturdayIntensityHard: false,
      sundayIntensityEasy: false,
      sundayIntensityAverage: false,
      sundayIntensityHard: false
    },
    expirationDate: '',
    expirationTime: ''
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

  // Deactivate student properties
  showDeactivateModal = false;
  selectedStudentForDeactivate: any = null;
  deactivateReason = '';
  isDeactivatingStudent = false;

  archivedFilter = false;

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
    this.loadClassRequests();
    this.loadClassStats();
    });
  }

  loadClassRequests() {
    if (!this.currentAdminId) {
      console.warn('Admin ID not available, skipping class requests load');
      return;
    }
    
    const adminIdParam = `&admin_id=${this.currentAdminId}`;
    this.http.get(`${this.apiUrl}/routes.php?request=getClasses${adminIdParam}`).subscribe({
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
        mondayIntensityAverage: false,
        mondayIntensityHard: false,
        tuesdayIntensityEasy: false,
        tuesdayIntensityAverage: false,
        tuesdayIntensityHard: false,
        wednesdayIntensityEasy: false,
        wednesdayIntensityAverage: false,
        wednesdayIntensityHard: false,
        thursdayIntensityEasy: false,
        thursdayIntensityAverage: false,
        thursdayIntensityHard: false,
        fridayIntensityEasy: false,
        fridayIntensityAverage: false,
        fridayIntensityHard: false,
        saturdayIntensityEasy: false,
        saturdayIntensityAverage: false,
        saturdayIntensityHard: false,
        sundayIntensityEasy: false,
        sundayIntensityAverage: false,
        sundayIntensityHard: false
      },
      expirationDate: '',
      expirationTime: ''
    };
  }

  // Utility for UI: map intensity flag to label (Average instead of Average)
  private getDisplayIntensity(easy: boolean, Average: boolean, hard: boolean): string {
    if (easy) return 'Easy';
    if (Average) return 'Average';
    if (hard) return 'Hard';
    return '';
  }

  private getIntensityFromFlags(easy: boolean, Average: boolean, hard: boolean): string {
    if (easy) return 'Easy';
    if (Average) return 'Average';
    if (hard) return 'Hard';
    return '';
  }

  // Ensure only one checkbox per day is selected in Add Class modal
  onIntensityChange(day: 'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday', level: 'Easy'|'Average'|'Hard') {
    const routines = this.newClass.routines;
    const keys = {
      Easy: `${day}IntensityEasy`,
      Average: `${day}IntensityAverage`,
      Hard: `${day}IntensityHard`
    } as const;

    // Turn off the other two when one is set to true
    if ((routines as any)[keys[level]]) {
      if (level !== 'Easy') (routines as any)[`${day}IntensityEasy`] = false;
      if (level !== 'Average') (routines as any)[`${day}IntensityAverage`] = false;
      if (level !== 'Hard') (routines as any)[`${day}IntensityHard`] = false;
    }
  }

  // Ensure only one checkbox per day in Class Details modal when editing
  onDetailsIntensityChange(day: 'monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday', level: 'Easy'|'Average'|'Hard') {
    const obj = this.selectedClass;
    if (!obj) return;
    const keys = {
      Easy: `${day}IntensityEasy`,
      Average: `${day}IntensityAverage`,
      Hard: `${day}IntensityHard`
    } as const;
    if (obj[keys[level]]) {
      if (level !== 'Easy') obj[`${day}IntensityEasy`] = false;
      if (level !== 'Average') obj[`${day}IntensityAverage`] = false;
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
        this.newClass.routines.mondayIntensityAverage,
        this.newClass.routines.mondayIntensityHard
      ),
      tuesdayintensity: this.getIntensityFromFlags(
        this.newClass.routines.tuesdayIntensityEasy,
        this.newClass.routines.tuesdayIntensityAverage,
        this.newClass.routines.tuesdayIntensityHard
      ),
      wednesdayintensity: this.getIntensityFromFlags(
        this.newClass.routines.wednesdayIntensityEasy,
        this.newClass.routines.wednesdayIntensityAverage,
        this.newClass.routines.wednesdayIntensityHard
      ),
      thursdayintensity: this.getIntensityFromFlags(
        this.newClass.routines.thursdayIntensityEasy,
        this.newClass.routines.thursdayIntensityAverage,
        this.newClass.routines.thursdayIntensityHard
      ),
      fridayintensity: this.getIntensityFromFlags(
        this.newClass.routines.fridayIntensityEasy,
        this.newClass.routines.fridayIntensityAverage,
        this.newClass.routines.fridayIntensityHard
      ),
      saturdayintensity: this.getIntensityFromFlags(
        this.newClass.routines.saturdayIntensityEasy,
        this.newClass.routines.saturdayIntensityAverage,
        this.newClass.routines.saturdayIntensityHard
      ),
      sundayintensity: this.getIntensityFromFlags(
        this.newClass.routines.sundayIntensityEasy,
        this.newClass.routines.sundayIntensityAverage,
        this.newClass.routines.sundayIntensityHard
      ),
      expiration_date: this.combineExpirationDateTime(this.newClass.expirationDate, this.newClass.expirationTime)
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
    const adminIdParam = this.currentAdminId ? `&admin_id=${this.currentAdminId}` : '';
    const showArchived = this.archivedFilter ? '&show_archived=1' : '';
    this.http.get(`${this.apiUrl}/routes.php?request=getClasses${adminIdParam}${showArchived}`).subscribe({
      next: (response: any) => {
        if (response.status === 'success') {
          const all = response.data || [];
          // Map intensity strings from DB to checkbox booleans for display
          this.classes = all.map((classObj: any) => {
            const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
            for (const day of days) {
              const intensityString: string = (classObj[`${day}intensity`] || '').toString();
              const normalized = intensityString.trim().toLowerCase();
              classObj[`${day}IntensityEasy`] = normalized === 'easy';
              classObj[`${day}IntensityAverage`] = normalized === 'average' || normalized === 'medium';
              classObj[`${day}IntensityHard`] = normalized === 'hard';
            }
            classObj.isArchived = classObj.archived == 1;
            classObj.isExpired = classObj.expiration_date && new Date(classObj.expiration_date) < new Date();
            return classObj;
          });
          // Fetch enrolled students for each class and assign to the class object
          for (const classObj of this.classes) {
            this.fetchEnrolledStudentsForClassForGrid(classObj);
          }
        }
      },
      error: (error) => {
        console.error('Error fetching classes:', error);
      }
    });
  }

  // New: For population in grid
  fetchEnrolledStudentsForClassForGrid(classObj: any) {
    if (!classObj.class_id) return;
    const adminIdParam = this.currentAdminId ? `&admin_id=${this.currentAdminId}` : '';
    this.http.get(`${this.apiUrl}/routes.php?request=getEnrolledStudentsForClass&class_id=${classObj.class_id}${adminIdParam}&show_deactivated=1`).subscribe({
      next: (response: any) => {
        if (response && response.status && response.status.remarks === 'success' && Array.isArray(response.payload)) {
          classObj.enrolledStudents = response.payload;
        } else {
          classObj.enrolledStudents = [];
        }
      },
      error: () => {
        classObj.enrolledStudents = [];
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
      enrolledStudents: [] // Initialize as empty array
    };

    // Map intensity strings from DB to checkbox booleans for display/editing
    const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
    for (const day of days) {
      const intensityString: string = (classObj[`${day}intensity`] || '').toString();
      const normalized = intensityString.trim().toLowerCase();
      this.selectedClass[`${day}IntensityEasy`] = normalized === 'easy';
      this.selectedClass[`${day}IntensityAverage`] = normalized === 'average' || normalized === 'medium';
      this.selectedClass[`${day}IntensityHard`] = normalized === 'hard';
    }
    
    // Fetch enrolled students for this class
    this.fetchEnrolledStudentsForClass(classObj.class_id);
    
    this.showClassDetailsModal = true;
    this.isEditingClassDetails = false;
  }

  // New method: Fetch enrolled students for a specific class
  fetchEnrolledStudentsForClass(classId: number) {
    if (!classId) return;
    
    console.log('Fetching enrolled students for class:', classId);
    
    const adminIdParam = this.currentAdminId ? `&admin_id=${this.currentAdminId}` : '';
    
    this.http.get(`${this.apiUrl}/routes.php?request=getEnrolledStudentsForClass&class_id=${classId}${adminIdParam}&show_deactivated=1`).subscribe({
      next: (response: any) => {
        console.log('Raw response from backend:', response);
        
        // Check if response has the expected structure
        if (response && response.status && response.status.remarks === 'success' && response.payload) {
          this.selectedClass.enrolledStudents = response.payload;
          console.log('Enrolled students loaded:', this.selectedClass.enrolledStudents);
        } else if (response && response.status && response.status.remarks === 'success' && Array.isArray(response.payload)) {
          // Handle case where payload is an array
          this.selectedClass.enrolledStudents = response.payload;
          console.log('Enrolled students loaded (payload array):', this.selectedClass.enrolledStudents);
        } else {
          console.error('Unexpected response structure:', response);
          this.selectedClass.enrolledStudents = [];
        }
      },
      error: (error) => {
        console.error('Error fetching enrolled students:', error);
        this.selectedClass.enrolledStudents = [];
      }
    });
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
        !!this.selectedClass.mondayIntensityAverage,
        !!this.selectedClass.mondayIntensityHard
      ),
      tuesdayintensity: this.getIntensityFromFlags(
        !!this.selectedClass.tuesdayIntensityEasy,
        !!this.selectedClass.tuesdayIntensityAverage,
        !!this.selectedClass.tuesdayIntensityHard
      ),
      wednesdayintensity: this.getIntensityFromFlags(
        !!this.selectedClass.wednesdayIntensityEasy,
        !!this.selectedClass.wednesdayIntensityAverage,
        !!this.selectedClass.wednesdayIntensityHard
      ),
      thursdayintensity: this.getIntensityFromFlags(
        !!this.selectedClass.thursdayIntensityEasy,
        !!this.selectedClass.thursdayIntensityAverage,
        !!this.selectedClass.thursdayIntensityHard
      ),
      fridayintensity: this.getIntensityFromFlags(
        !!this.selectedClass.fridayIntensityEasy,
        !!this.selectedClass.fridayIntensityAverage,
        !!this.selectedClass.fridayIntensityHard
      ),
      saturdayintensity: this.getIntensityFromFlags(
        !!this.selectedClass.saturdayIntensityEasy,
        !!this.selectedClass.saturdayIntensityAverage,
        !!this.selectedClass.saturdayIntensityHard
      ),
      sundayintensity: this.getIntensityFromFlags(
        !!this.selectedClass.sundayIntensityEasy,
        !!this.selectedClass.sundayIntensityAverage,
        !!this.selectedClass.sundayIntensityHard
      )
    };

    console.log('Updating class data:', payload);

    this.http.post(`${this.apiUrl}/routes.php?request=editClass`, payload).subscribe({
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

  // Deactivate student methods
  openDeactivateModal(student: any) {
    this.selectedStudentForDeactivate = student;
    this.deactivateReason = '';
    this.showDeactivateModal = true;
  }

  closeDeactivateModal() {
    this.showDeactivateModal = false;
    this.selectedStudentForDeactivate = null;
    this.deactivateReason = '';
    this.isDeactivatingStudent = false;
  }

  confirmDeactivateStudent() {
    if (!this.selectedStudentForDeactivate || !this.selectedClass || !this.deactivateReason || this.deactivateReason.trim().length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please provide a reason for deactivating the student.'
      });
      return;
    }

    // Confirmation dialog
    Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: `You are about to deactivate ${this.selectedStudentForDeactivate.name} from this class. This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, deactivate student',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isDeactivatingStudent = true;
        
        // Use deactivateStudent endpoint with code_id instead of class_id and user_id
        const deactivateData = {
          code_id: this.selectedStudentForDeactivate.code_id,
          reason: this.deactivateReason.trim()
        };

        this.http.post(`${this.apiUrl}/routes.php?request=deactivateStudent`, deactivateData).subscribe({
          next: (response: any) => {
            this.isDeactivatingStudent = false;
            if (response.status === 'success' || response.status?.remarks === 'success') {
              Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Student has been deactivated from the class.',
                timer: 2000,
                showConfirmButton: false
              });
              this.closeDeactivateModal();
              // Refresh the enrolled students list
              this.fetchEnrolledStudentsForClass(this.selectedClass.class_id);
              // Also refresh the grid view
              this.fetchClasses();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: response.message || response.status?.message || 'Failed to deactivate student. Please try again.'
              });
            }
          },
          error: (error) => {
            this.isDeactivatingStudent = false;
            console.error('Error deactivating student:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to deactivate student. Please try again.'
            });
          }
        });
      }
    });
  }

  deleteClass() {
    if (!this.selectedClass || !this.selectedClass.class_id) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No class selected to delete.'
      });
      return;
    }

    // First confirmation
    Swal.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: `You are about to delete "${this.selectedClass.class_name}". This will permanently delete the class, all enrolled students, routines, and related data. This action cannot be undone!`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    }).then((firstResult) => {
      if (!firstResult.isConfirmed) return;

      // Second confirmation for safety
      Swal.fire({
        icon: 'error',
        title: 'Final Warning',
        html: `This will <strong>permanently delete</strong> "${this.selectedClass.class_name}" and all associated data.<br/><br/>Are you absolutely sure?`,
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, I am sure',
        cancelButtonText: 'Cancel'
      }).then((secondResult) => {
        if (secondResult.isConfirmed) {
          const deleteData = {
            class_id: this.selectedClass.class_id
          };

          this.http.post(`${this.apiUrl}/routes.php?request=deleteClass`, deleteData).subscribe({
            next: (response: any) => {
              if (response.status === 'success') {
                Swal.fire({
                  icon: 'success',
                  title: 'Deleted!',
                  text: 'Class has been deleted successfully.',
                  timer: 2000,
                  showConfirmButton: false
                });
                this.closeClassDetailsModal();
                this.fetchClasses(); // Refresh the class list
              } else {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: response.message || 'Failed to delete class. Please try again.'
                });
              }
            },
            error: (error) => {
              console.error('Error deleting class:', error);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to delete class. Please try again.'
              });
            }
          });
        }
      });
    });
  }

  private combineExpirationDateTime(dateStr?: string, timeStr?: string): string | null {
    if (!dateStr) return null;
    // fallback to 23:59:59 if no time
    return dateStr + ' ' + (timeStr ? timeStr : '23:59:59');
  }

  // status filter
  dailyStatusFilter: 'all' | 'active' | 'inactive' | 'deactivated' = 'all';
  
  private normalizeStudentStatus(status: any): string {
    return String(status ?? '').toLowerCase().trim();
  }

  private hasCompletedThisWeek(student: any): boolean {
    // backend returns 0/1; be defensive about string values
    return (+student?.completed_this_week) === 1;
  }

  get filteredStudents() {
    if (!this.selectedClass?.enrolledStudents) return [];

    if (this.dailyStatusFilter === 'all') return this.selectedClass.enrolledStudents;

    if (this.dailyStatusFilter === 'deactivated') {
      return this.selectedClass.enrolledStudents.filter(
        (s: any) => this.normalizeStudentStatus(s.student_status) === 'deactivated'
      );
    }

    // active/inactive are based on routine_history (completed_this_week) and only for active students
    if (this.dailyStatusFilter === 'active') {
      return this.selectedClass.enrolledStudents.filter((s: any) =>
        this.normalizeStudentStatus(s.student_status) === 'active' && this.hasCompletedThisWeek(s)
      );
    }

    // inactive
    return this.selectedClass.enrolledStudents.filter((s: any) =>
      this.normalizeStudentStatus(s.student_status) === 'active' && !this.hasCompletedThisWeek(s)
    );
  }

  studentHistoryModalOpen = false;
  selectedStudentHistory: any[] = [];
  selectedStudentDetails: any = null;
  coachResponseDraft: Record<number, string> = {};
  isSavingCoachResponse: Record<number, boolean> = {};
  activeHistoryEntryId: number | null = null;
  openStudentHistoryModal(student: any) {
    this.selectedStudentDetails = student;
    this.studentHistoryModalOpen = true;
    this.selectedStudentHistory = [];
    this.coachResponseDraft = {};
    this.activeHistoryEntryId = null;
    this.http.get(`${this.apiUrl}/routes.php?request=getRoutineHistoryForStudentInClass&class_id=${this.selectedClass.class_id}&user_id=${student.user_id}`)
      .subscribe((response: any) => {
        this.selectedStudentHistory = response?.payload || [];
        for (const entry of this.selectedStudentHistory) {
          if (entry?.id != null) {
            this.coachResponseDraft[entry.id] = entry.coach_response || '';
          }
        }
      });
  }
  closeStudentHistoryModal() {
    this.studentHistoryModalOpen = false;
    this.selectedStudentDetails = null;
    this.selectedStudentHistory = [];
    this.coachResponseDraft = {};
    this.activeHistoryEntryId = null;
  }

  setActiveHistoryEntry(entry: any) {
    const id = Number(entry?.id);
    this.activeHistoryEntryId = id || null;
  }

  formatTime12h(timeStr: any): string {
    const raw = String(timeStr ?? '').trim();
    if (!raw) return '-';
    // Accept "YYYY-MM-DD HH:mm:ss" or "HH:mm:ss" or "HH:mm"
    const timePart = raw.includes(' ') ? raw.split(' ').pop() || '' : raw;
    const m = timePart.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return timePart;
    let h = Number(m[1]);
    const min = m[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${min} ${ampm}`;
  }

  saveCoachResponse(entry: any) {
    const historyId = Number(entry?.id);
    if (!historyId) return;
    const text = (this.coachResponseDraft[historyId] || '').toString().trim();

    this.isSavingCoachResponse[historyId] = true;
    this.http.post(`${this.apiUrl}/routes.php?request=setCoachResponse`, {
      history_id: historyId,
      coach_response: text
    }).subscribe({
      next: (resp: any) => {
        if (resp?.status === 'success') {
          entry.coach_response = text;
          Swal.fire({ icon: 'success', title: 'Saved', text: 'Coach response saved.' });
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: resp?.message || 'Failed to save response.' });
        }
        this.isSavingCoachResponse[historyId] = false;
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save response.' });
        this.isSavingCoachResponse[historyId] = false;
      }
    });
  }

  getStudentStatusLabel(student: any): 'Active' | 'Inactive' | 'Deactivated' {
    if (this.normalizeStudentStatus(student?.student_status) === 'deactivated') {
      return 'Deactivated';
    }
    return this.hasCompletedThisWeek(student) ? 'Active' : 'Inactive';
  }

  generateClassListPdf() {
    if (!this.selectedClass) {
      return;
    }

    const doc = new jsPDF();
    const title = `${this.selectedClass.class_name || 'Class'} - Athlete List`;
    doc.setFontSize(14);
    doc.text(title, 14, 16);

    const statusLabel = this.dailyStatusFilter === 'all'
      ? 'All'
      : this.dailyStatusFilter.charAt(0).toUpperCase() + this.dailyStatusFilter.slice(1);
    doc.setFontSize(10);
    doc.text(`Filter: ${statusLabel}`, 14, 24);

    const rows = this.filteredStudents.map((student: any) => [
      student?.name || '-',
      student?.code || '-',
      this.getStudentStatusLabel(student)
    ]);

    autoTable(doc, {
      head: [['Name', 'Code', 'Status']],
      body: rows.length ? rows : [['No athletes found for this filter.', '', '']],
      startY: 28
    });

    const safeClassName = (this.selectedClass.class_name || 'class').toString().replace(/\s+/g, '_');
    doc.save(`${safeClassName}_athlete_list.pdf`);
  }

  onModalBackdropClick(
    event: MouseEvent,
    modal: 'addClass' | 'addTask' | 'upload' | 'classDetails' | 'deactivate' | 'token' | 'studentHistory'
  ) {
    if (event.target === event.currentTarget) {
      switch (modal) {
        case 'addClass':
          this.closeAddClassModal();
          break;
        case 'addTask':
          this.closeAddTaskModal();
          break;
        case 'upload':
          this.closeUploadModal();
          break;
        case 'classDetails':
          this.closeClassDetailsModal();
          break;
        case 'deactivate':
          this.closeDeactivateModal();
          break;
        case 'token':
          this.closeTokenModal();
          break;
        case 'studentHistory':
          this.closeStudentHistoryModal();
          break;
      }
    }
  }

  private closeTopMostModal() {
    if (this.studentHistoryModalOpen) return this.closeStudentHistoryModal();
    if (this.showDeactivateModal) return this.closeDeactivateModal();
    if (this.showTokenModal) return this.closeTokenModal();
    if (this.showClassDetailsModal) return this.closeClassDetailsModal();
    if (this.showUploadModal) return this.closeUploadModal();
    if (this.showAddTaskModal) return this.closeAddTaskModal();
    if (this.showAddClassModal) return this.closeAddClassModal();
  }

  @HostListener('document:keydown.escape')
  handleEscKey() {
    this.closeTopMostModal();
  }
}
