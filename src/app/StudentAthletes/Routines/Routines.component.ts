import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RoutinesService, ClassInfo, Routine, RoutineHistory } from '../../services/routines.service';

@Component({
  selector: 'app-Routines',
  standalone: true,
  imports: [SidenavComponent, NavbarComponent, CommonModule, FormsModule, HttpClientModule],
  templateUrl: './Routines.component.html',
  styleUrl: './Routines.component.css'
})
export class RoutinesComponent implements OnInit {
  isNavOpen = true;
  showEnrollmentModal = false;
  showUploadModal = false;
  showRoutineCompletionModal = false;
  showConfirmationModal = false;
  
  // Enrollment related
  enrollmentToken = '';
  studentUsername = '';
  studentUserId: number | null = null;
  
  // Class and routine data
  enrolledClasses: ClassInfo[] = [];
  selectedClass: ClassInfo | null = null;
  classRoutines: any[] = [];
  routineHistory: RoutineHistory[] = [];
  searchTerm = '';
  weekly: { [day: string]: { task: string; intensity: string } } | null = null;
  selectedClassDescription = '';
  
  // Upload related
  selectedFile: File | null = null;
  selectedRoutine: Routine | null = null;
  
  // New routine completion modal properties
  selectedDay: string = '';
  selectedRoutineData: { task: string; intensity: string } | null = null;
  
  // Loading states
  isLoading = false;
  isEnrolling = false;
  isLoadingClasses = false;
  isLoadingRoutines = false;

  constructor(private routinesService: RoutinesService) {}

  ngOnInit() {
    // Pull username from localStorage set by navbar
    const storedUsername = localStorage.getItem('username');
    if (storedUsername && storedUsername.trim().length > 0) {
      this.studentUsername = storedUsername;
    }
    const storedId = localStorage.getItem('hoa_user_id');
    this.studentUserId = storedId ? Number(storedId) : null;
    console.log('RoutinesComponent init - using studentUsername:', this.studentUsername);
    console.log('RoutinesComponent init - using studentUserId:', this.studentUserId);
    this.loadEnrolledClasses();
  }

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  // Class enrollment methods
  openEnrollmentModal() {
    this.showEnrollmentModal = true;
    this.enrollmentToken = '';
  }

  closeEnrollmentModal() {
    this.showEnrollmentModal = false;
    this.enrollmentToken = '';
  }

  async enrollInClass() {
    console.log('=== enrollInClass START ===');
    console.log('Input validation check:');
    console.log('- enrollmentToken:', this.enrollmentToken);
    console.log('- enrollmentToken length:', this.enrollmentToken?.length);
    console.log('- studentUsername:', this.studentUsername);
    
    if (!this.enrollmentToken || this.enrollmentToken.length !== 7) {
      console.log('❌ Token validation failed - invalid length or empty');
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Token',
        text: 'Please enter a valid 7-digit token',
        confirmButtonColor: '#0A7664'
      });
      return;
    }
    
    console.log('✅ Token validation passed');
    this.isEnrolling = true;
    
    // Debug: Log what we're sending to the API
    console.log('📤 Preparing API request:');
    console.log('- Token:', this.enrollmentToken);
    console.log('- Student Username:', this.studentUsername);
    console.log('- Request URL:', 'POST /validate-token');
    
    try {
      console.log('🚀 Making API call...');
      const result = await this.routinesService.validateToken(this.enrollmentToken, this.studentUsername, this.studentUserId).toPromise();
      
      console.log('📥 API Response received:');
      console.log('- Full result object:', result);
      console.log('- Result type:', typeof result);
      console.log('- Result keys:', result ? Object.keys(result) : 'null/undefined');
      console.log('- Status field:', result?.status);
      console.log('- Message field:', result?.message);
      
      if (result.status === 'success') {
        console.log('✅ API returned success status');
        const confirmSwal = await Swal.fire({
          icon: 'question',
          title: 'Redeem token?',
          text: 'Are you sure you want to redeem this one-time token?',
          showCancelButton: true,
          confirmButtonText: 'Yes, redeem',
          cancelButtonText: 'Cancel',
          confirmButtonColor: '#0A7664',
          cancelButtonColor: '#6B7280'
        });
        if (confirmSwal.isConfirmed) {
          console.log('✅ User confirmed enrollment');
          await Swal.fire({
            icon: 'success',
            title: 'Enrolled Successfully!',
            text: 'You have been enrolled in the class!',
            timer: 2000,
            showConfirmButton: false,
            confirmButtonColor: '#0A7664'
          });
          this.closeEnrollmentModal();
          this.loadEnrolledClasses();
        } else {
          console.log('❌ User cancelled enrollment');
        }
      } else {
        console.log('❌ API returned error status:', result.status);
        console.log('❌ Error message:', result.message);
        await Swal.fire({
          icon: 'error',
          title: 'Enrollment Failed',
          text: result.message || 'Invalid token or enrollment failed',
          confirmButtonColor: '#0A7664'
        });
      }
    } catch (error: any) {
      console.log('💥 API call failed with error:');
      console.error('Enrollment error:', error);
      console.log('- Error type:', typeof error);
      console.log('- Error name:', error?.name);
      console.log('- Error message:', error?.message);
      console.log('- Error status:', error?.status);
      console.log('- Error statusText:', error?.statusText);
      console.log('- Error url:', error?.url);
      console.log('- Error ok:', error?.ok);
      
      if (error?.error) {
        console.log('- Nested error object:', error.error);
        console.log('- Nested error type:', typeof error.error);
        console.log('- Nested error message:', error.error?.message);
      }
      
      let errorMessage = 'Enrollment failed. Please try again.';
      if (error?.status === 0) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error?.status === 404) {
        errorMessage = 'Service not found. Please contact support.';
      } else if (error?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      await Swal.fire({ 
        icon: 'error', 
        title: 'Connection Error', 
        text: errorMessage,
        confirmButtonColor: '#0A7664'
      });
    } finally {
      this.isEnrolling = false;
      console.log('=== enrollInClass END ===');
    }
  }

  // Load enrolled classes
  async loadEnrolledClasses() {
    console.log('=== loadEnrolledClasses START ===');
    console.log('Loading classes for user_id:', this.studentUserId);
    
    this.isLoadingClasses = true;
    
    try {
      console.log('🚀 Making API call to getEnrolledClasses...');
      if (!this.studentUserId) {
        throw new Error('Missing user_id');
      }
      const response = await this.routinesService.getEnrolledClassesById(this.studentUserId).toPromise();
      //const response = await this.routinesService.getAllEnrolledClasses().toPromise();
      
      console.log('📥 API Response for enrolled classes:');
      console.log('- Full response:', response);
      console.log('- Response type:', typeof response);
      console.log('- Has payload:', !!response?.payload);
      console.log('- Payload type:', typeof response?.payload);
      console.log('- Payload length:', response?.payload?.length);
      
      // Filter by userId on the frontend
      if (response && response.payload) {
        this.enrolledClasses = response.payload || [];
        console.log('✅ Classes loaded successfully:', this.enrolledClasses);
        if (this.enrolledClasses.length > 0) {
          // Auto-load first class (no dropdown)
          await this.selectClass(this.enrolledClasses[0]);
        }
      } else {
        console.log('ℹ️ No response or payload, setting empty array');
        this.enrolledClasses = [];
      }
    } catch (error: any) {
      console.log('💥 Error loading classes:');
      console.error('Error details:', error);
      console.log('- Error type:', typeof error);
      console.log('- Error message:', error?.message);
      this.enrolledClasses = [];
      
      // Don't show error for CORS issues - just log them
      if (error?.status === 0 || error?.message?.includes('CORS')) {
        console.log('CORS or network error detected - not showing user error');
      } else {
        let errorMessage = 'Failed to load classes';
        if (error?.status === 404) {
          errorMessage = 'Classes service not found';
        } else if (error?.status === 500) {
          errorMessage = 'Server error loading classes';
        }
        
        Swal.fire({ 
          icon: 'error', 
          title: 'Loading Error', 
          text: errorMessage,
          confirmButtonColor: '#735DA5'
        });
      }
    } finally {
      this.isLoadingClasses = false;
      console.log('=== loadEnrolledClasses END ===');
    }
  }

  // Select a class and load its routines
  async selectClass(classInfo: ClassInfo) {
    this.selectedClass = classInfo;
    this.isLoadingRoutines = true;
    
    try {
      // fetch class meta (title/description/coach)
      const meta = await this.routinesService.getClassInfo(classInfo.id).toPromise();
      if (meta?.payload) {
        const p = meta.payload;
        
        // Resolve coach username from ID if it's a numeric value
        let coachUsername = p.coach_username;
        if (p.coach_username && !isNaN(Number(p.coach_username))) {
          try {
            const coachInfo = await this.routinesService.getCoachUsername(Number(p.coach_username)).toPromise();
            if (coachInfo?.payload?.username) {
              coachUsername = coachInfo.payload.username;
            }
          } catch (coachError) {
            console.warn('Failed to resolve coach username:', coachError);
            // Keep the original coach_username if resolution fails
          }
        }
        
        this.selectedClass = { 
          ...(this.selectedClass || {} as any), 
          title: p.title, 
          coach_username: coachUsername 
        } as any;
        (this as any).selectedClassDescription = p.description || '';
      }

      const response = await this.routinesService.getClassRoutines(classInfo.id).toPromise();
      if (response && response.payload) {
        const r = response.payload;
        // Expect payload.weekly when backend returns weekly structure
        if (r && r.weekly) {
          this.weekly = r.weekly;
        } else if (Array.isArray(r)) {
          this.classRoutines = r || [];
        }
        this.loadRoutineHistory();
      } else {
        this.classRoutines = [];
        this.weekly = null;
      }
    } catch (error) {
      console.error('Error loading routines:', error);
      this.classRoutines = [];
      this.weekly = null;
      
      // Show user-friendly error
      Swal.fire({
        icon: 'warning',
        title: 'Routines Unavailable',
        text: 'Unable to load routines for this class. Please try again later.',
        confirmButtonColor: '#0A7664'
      });
    } finally {
      this.isLoadingRoutines = false;
    }
  }

  // Load routine history
  async loadRoutineHistory() {
    try {
      const response = await this.routinesService.getRoutineHistory(this.studentUsername).toPromise();
      if (response && response.payload) {
        this.routineHistory = response.payload || [];
      } else {
        this.routineHistory = [];
      }
    } catch (error) {
      console.error('Error loading history:', error);
      this.routineHistory = [];
    }
  }

  // New routine completion modal methods
  openRoutineCompletionModal(day: string, routineData: { task: string; intensity: string }) {
    this.selectedDay = day;
    this.selectedRoutineData = routineData;
    this.showRoutineCompletionModal = true;
    this.selectedFile = null;
  }

  closeRoutineCompletionModal() {
    this.showRoutineCompletionModal = false;
    this.selectedDay = '';
    this.selectedRoutineData = null;
    this.selectedFile = null;
  }

  async confirmRoutineCompletion() {
    console.log('[Routine Completion] Attempting to complete routine:', {
      selectedFile: this.selectedFile,
      selectedRoutineData: this.selectedRoutineData,
      selectedClass: this.selectedClass,
      selectedDay: this.selectedDay,
      studentUsername: this.studentUsername,
      studentUserId: this.studentUserId
    });
    if (!this.selectedFile || !this.selectedRoutineData || !this.selectedClass) {
      console.warn('[Routine Completion] Missing information:', {
        selectedFile: this.selectedFile,
        selectedRoutineData: this.selectedRoutineData,
        selectedClass: this.selectedClass
      });
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select a file and ensure routine data is available.',
        confirmButtonColor: '#0A7664'
      });
      return;
    }

    try {
      const intensityMap: { [key: string]: string } = {
        'Easy': 'Low',
        'Medium': 'Medium',
        'Hard': 'High'
      };
      const dbIntensity = intensityMap[this.selectedRoutineData?.intensity || 'Medium'] || 'Medium';
      console.log('[Routine Completion] Submitting routine completion with:', {
        routineId: this.selectedClass.id,
        studentUsername: this.studentUsername,
        file: this.selectedFile,
        userId: this.studentUserId,
        routine: `${this.selectedDay}: ${this.selectedRoutineData?.task}`,
        intensity: dbIntensity
      });
      const response = await this.routinesService.submitRoutineCompletion(
        this.selectedClass.id,
        this.studentUserId,
        this.selectedFile,
        `${this.selectedDay}: ${this.selectedRoutineData?.task}`,
        dbIntensity
      ).toPromise();
      console.log('[Routine Completion] API response:', response);
      if (response && response.status !== 'success') {
        throw new Error(response.message || 'Unknown error from API');
      }
      // Show success message with uploaded image
      await Swal.fire({
        icon: 'success',
        title: 'Routine Completed!',
        text: `${this.selectedDay} routine completed successfully!`,
        imageUrl: response.image_url || null,
        imageWidth: 300,
        imageHeight: 200,
        imageAlt: 'Uploaded Routine Image',
        timer: 3000,
        showConfirmButton: false,
        confirmButtonColor: '#0A7664'
      });
      this.closeRoutineCompletionModal();
      this.loadRoutineHistory();
    } catch (error: any) {
      console.error('[Routine Completion] Upload error:', error);
      let errorMessage = 'Failed to complete routine. Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      await Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: errorMessage,
        confirmButtonColor: '#735DA5'
      });
    }
  }

  // Helper method to convert day name to number
  private getDayNumber(day: string): number {
    const dayMap: { [key: string]: number } = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 7
    };
    return dayMap[day] || 0;
  }

  // Check if routine is completed today (for weekly structure)
  isRoutineCompletedToday(dayOrId: string | number): boolean {
    // Get current date in Philippine timezone (UTC+8)
    const philippineTime = new Date();
    philippineTime.setHours(philippineTime.getHours() + 8); // Adjust to Philippine time
    const today = philippineTime.toDateString();
    
    if (typeof dayOrId === 'string') {
      // For weekly structure, check by day name - we need to check if this specific day's routine was completed today
      if (!this.selectedClass) return false;
      return this.routineHistory.some(history => {
        // Convert history date to Philippine timezone for comparison
        const historyDate = new Date(history.date_of_submission);
        historyDate.setHours(historyDate.getHours() + 8); // Adjust to Philippine time
        const historyDateString = historyDate.toDateString();
        
        // Check if the routine was completed today for this class and includes the day name
        return historyDateString === today && 
               history.class_id === this.selectedClass?.id && 
               history.routine.includes(dayOrId);
      });
    } else {
      // For individual routines, check by class ID
      return this.routineHistory.some(history => {
        // Convert history date to Philippine timezone for comparison
        const historyDate = new Date(history.date_of_submission);
        historyDate.setHours(historyDate.getHours() + 8); // Adjust to Philippine time
        const historyDateString = historyDate.toDateString();
        
        return history.class_id === dayOrId && 
               historyDateString === today;
      });
    }
  }

  // Routine completion methods (legacy)
  openUploadModal(routine: Routine) {
    this.selectedRoutine = routine;
    this.showUploadModal = true;
    this.selectedFile = null;
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.selectedRoutine = null;
    this.selectedFile = null;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  async confirmUpload() {
    console.log('[Routine Upload] Attempting to upload routine:', {
      selectedFile: this.selectedFile,
      selectedRoutine: this.selectedRoutine,
      studentUsername: this.studentUsername,
      studentUserId: this.studentUserId
    });
    if (!this.selectedFile || !this.selectedRoutine) {
      console.warn('[Routine Upload] Missing information:', {
        selectedFile: this.selectedFile,
        selectedRoutine: this.selectedRoutine
      });
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select a file and routine',
        confirmButtonColor: '#735DA5'
      });
      return;
    }
    try {
      console.log('[Routine Upload] Submitting routine completion with:', {
        routineId: this.selectedRoutine.id,
        studentUsername: this.studentUsername,
        file: this.selectedFile,
        userId: this.studentUserId
      });
      const response = await this.routinesService.submitRoutineCompletion(
        this.selectedRoutine.id,
        this.studentUserId,
        this.selectedFile
      ).toPromise();
      console.log('[Routine Upload] API response:', response);
      if (response && response.status !== 'success') {
        throw new Error(response.message || 'Unknown error from API');
      }
      // Show success message with uploaded image
      await Swal.fire({
        icon: 'success',
        title: 'Routine Completed!',
        text: 'Routine completed successfully!',
        imageUrl: response.image_url || null,
        imageWidth: 300,
        imageHeight: 200,
        imageAlt: 'Uploaded Routine Image',
        timer: 3000,
        showConfirmButton: false,
        confirmButtonColor: '#735DA5'
      });
      this.closeUploadModal();
      this.loadRoutineHistory();
    } catch (error: any) {
      console.error('[Routine Upload] Upload error:', error);
      let errorMessage = 'Failed to complete routine. Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      await Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: errorMessage,
        confirmButtonColor: '#735DA5'
      });
    }
  }

  // Get routine status for today
  getRoutineStatus(routine: Routine): string {
    if (this.isRoutineCompletedToday(routine.id)) {
      return 'Completed';
    }
    return 'Pending';
  }

  // Get filtered classes based on search term
  get filteredClasses(): ClassInfo[] {
    if (!this.searchTerm) return this.enrolledClasses;
    return this.enrolledClasses.filter(cls => 
      cls.title?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      cls.coach_username?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      cls.sport?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
}
