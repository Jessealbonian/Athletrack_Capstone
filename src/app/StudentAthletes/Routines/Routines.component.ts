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
  private readonly maxUploadBytes = 10 * 1024 * 1024; // 10MB upload cap
  private readonly supportedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];

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
  selectedClass: ClassInfo | null = null; // used by modals/actions
  classRoutines: any[] = []; // legacy/single-view fallback
  routineHistory: RoutineHistory[] = [];
  searchTerm = '';
  weekly: { [day: string]: { task: string; intensity: string } } | null = null; // legacy/single-view fallback
  selectedClassDescription = ''; // legacy/single-view fallback
  daysOfWeek: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Multi-class view state (render all enrolled classes)
  classViews: Array<{
    classInfo: ClassInfo;
    title?: string;
    coach_username?: string;
    description?: string;
    weekly: { [day: string]: { task: string; intensity: string } } | null;
    classRoutines: any[];
    isLoading: boolean;
    error?: string;
  }> = [];
  
  // Upload related
  selectedFile: File | null = null;
  selectedRoutine: Routine | null = null;
  fileValidationMessage = '';
  
  // New routine completion modal properties
  selectedDay: string = '';
  selectedRoutineData: { task: string; intensity: string } | null = null;
  reflectionText: string = '';
  submissionDate: string = ''; // YYYY-MM-DD, derived from selectedDay in current week
  
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
    if (this.studentUserId && !this.studentUsername) {
      this.routinesService.getHoaUserProfById(this.studentUserId).subscribe({
        next: (resp: any) => {
          const row = resp?.data?.[0] ?? resp?.payload?.[0] ?? null;
          if (row?.username) {
            this.studentUsername = row.username;
            localStorage.setItem('username', this.studentUsername);
          }
        }
      });
    }
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
        // Load ALL enrolled classes so multiple can be shown
        this.classViews = this.enrolledClasses.map(cls => ({
          classInfo: cls,
          weekly: null,
          classRoutines: [],
          isLoading: true
        }));
        // Keep legacy fields in a safe state
        this.selectedClass = null;
        this.weekly = null;
        this.classRoutines = [];
        this.selectedClassDescription = '';
        await this.loadAllClassViews();
      } else {
        console.log('ℹ️ No response or payload, setting empty array');
        this.enrolledClasses = [];
        this.classViews = [];
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

  private async loadAllClassViews() {
    // Load in sequence to avoid spamming backend; could be parallelized later.
    for (const view of this.classViews) {
      // eslint-disable-next-line no-await-in-loop
      await this.loadClassView(view);
    }
    // history is user-wide; load once after views are populated
    this.loadRoutineHistory();
  }

  private async loadClassView(view: (typeof this.classViews)[number]) {
    view.isLoading = true;
    view.error = undefined;
    view.weekly = null;
    view.classRoutines = [];

    try {
      // fetch class meta (title/description/coach)
      const meta = await this.routinesService.getClassInfo(view.classInfo.id).toPromise();
      if (meta?.payload) {
        const p = meta.payload;
        let coachUsername = p.coach_username;
        if (p.coach_username && !isNaN(Number(p.coach_username))) {
          try {
            const coachInfo = await this.routinesService.getCoachUsername(Number(p.coach_username)).toPromise();
            if (coachInfo?.payload?.username) coachUsername = coachInfo.payload.username;
          } catch (coachError) {
            console.warn('Failed to resolve coach username:', coachError);
          }
        }
        view.title = p.title;
        view.coach_username = coachUsername;
        view.description = p.description || '';
      }

      const response = await this.routinesService.getClassRoutines(view.classInfo.id).toPromise();
      const payload = response?.payload;
      if (payload && payload.weekly) {
        view.weekly = payload.weekly;
      } else if (Array.isArray(payload)) {
        view.classRoutines = payload || [];
      } else {
        view.weekly = null;
        view.classRoutines = [];
      }
    } catch (error: any) {
      console.error('Error loading routines for class:', view.classInfo?.id, error);
      view.error = 'Unable to load routines for this class.';
      view.weekly = null;
      view.classRoutines = [];
    } finally {
      view.isLoading = false;
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
  openRoutineCompletionModal(classInfo: ClassInfo, day: string, routineData: { task: string; intensity: string }) {
    this.selectedClass = classInfo;
    this.selectedDay = day;
    this.selectedRoutineData = routineData;
    this.showRoutineCompletionModal = true;
    this.selectedFile = null;
    this.fileValidationMessage = '';
    this.reflectionText = '';
    this.submissionDate = this.getCurrentWeekDateForDay(day);
  }

  closeRoutineCompletionModal() {
    this.showRoutineCompletionModal = false;
    this.selectedDay = '';
    this.selectedRoutineData = null;
    this.selectedFile = null;
    this.fileValidationMessage = '';
    this.reflectionText = '';
    this.submissionDate = '';
  }

  private getPhilippineNow(): Date {
    const d = new Date();
    d.setHours(d.getHours() + 8);
    return d;
  }

  private toYmd(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private getCurrentWeekDateForDay(dayName: string): string {
    // Monday..Sunday for the current week, using PH time as the reference.
    const now = this.getPhilippineNow();
    const dayMap: Record<string, number> = {
      Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7
    };
    const targetDow = dayMap[dayName] ?? 0;
    if (!targetDow) return this.toYmd(now);

    // JS getDay(): 0=Sun..6=Sat → convert to 1=Mon..7=Sun
    const jsDow = now.getDay(); // 0..6
    const isoDow = jsDow === 0 ? 7 : jsDow; // 1..7
    const diff = targetDow - isoDow;
    const target = new Date(now);
    target.setDate(now.getDate() + diff);
    return this.toYmd(target);
  }

  async confirmRoutineCompletion() {
    console.log('[Routine Completion] Attempting to complete routine:', {
      selectedFile: this.selectedFile,
      selectedRoutineData: this.selectedRoutineData,
      selectedClass: this.selectedClass,
      selectedDay: this.selectedDay,
      studentUsername: this.studentUsername,
      studentUserId: this.studentUserId,
      reflection: this.reflectionText
    });
    if (!this.selectedFile || !this.selectedRoutineData || !this.selectedClass || !this.reflectionText) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select a file, enter your reflection, and ensure routine data is available.',
        confirmButtonColor: '#022F11'
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
      const response: any = await this.routinesService.submitRoutineCompletion(
        this.selectedClass.id,
        this.studentUserId,
        this.selectedFile,
        `${this.selectedDay}: ${this.selectedRoutineData?.task}`,
        dbIntensity,
        this.reflectionText,
        this.submissionDate
      ).toPromise();
      const ok =
        response?.status === 'success' ||
        response?.status?.remarks === 'success' ||
        response?.remarks === 'success';
      if (response && !ok) throw new Error(response?.message || response?.status?.message || 'Unknown error from API');
      await Swal.fire({
        icon: 'success',
        title: 'Routine Completed!',
        text: `${this.selectedDay} routine completed successfully!`,
        confirmButtonColor: '#022F11'
      });
      this.closeRoutineCompletionModal();
      this.reflectionText = '';
      this.loadRoutineHistory();
    } catch(err:any) {
      console.error('[Routine Completion] Upload error details:', err);
      const uploadErrorMessage = this.getUploadErrorMessage(err);
      await Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: uploadErrorMessage,
        confirmButtonColor: '#022F11'
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
  isRoutineCompletedForWeekday(classId: number, dayName: string): boolean {
    const ymd = this.getCurrentWeekDateForDay(dayName);
    return this.routineHistory.some(history =>
      history.class_id === classId &&
      String(history.date_of_submission || '').slice(0, 10) === ymd &&
      String(history.routine || '').includes(dayName)
    );
  }

  // Legacy / card mode check: still treat as "completed today"
  isRoutineCompletedToday(dayOrId: string | number): boolean {
    const now = this.getPhilippineNow();
    const todayYmd = this.toYmd(now);
    if (typeof dayOrId === 'string') {
      if (!this.selectedClass) return false;
      return this.routineHistory.some(history =>
        history.class_id === this.selectedClass?.id &&
        String(history.date_of_submission || '').slice(0, 10) === todayYmd &&
        String(history.routine || '').includes(dayOrId)
      );
    }
    return this.routineHistory.some(history =>
      history.class_id === dayOrId &&
      String(history.date_of_submission || '').slice(0, 10) === todayYmd
    );
  }

  // Routine completion methods (legacy)
  openUploadModal(routine: Routine) {
    this.selectedRoutine = routine;
    this.showUploadModal = true;
    this.selectedFile = null;
    this.fileValidationMessage = '';
    this.reflectionText = '';
  }

  closeUploadModal() {
    this.showUploadModal = false;
    this.selectedRoutine = null;
    this.selectedFile = null;
    this.fileValidationMessage = '';
    this.reflectionText = '';
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.fileValidationMessage = '';
    if (input.files && input.files.length > 0) {
      const rawFile = input.files[0];
      const fileType = (rawFile.type || '').toLowerCase();
      if (fileType && !this.supportedMimeTypes.includes(fileType)) {
        this.selectedFile = null;
        input.value = '';
        this.fileValidationMessage = 'Unsupported file type. Please upload JPG, PNG, or PDF only.';
        return;
      }

      try {
        this.selectedFile = await this.prepareUploadFile(rawFile);
      } catch (error: any) {
        this.selectedFile = null;
        input.value = '';
        this.fileValidationMessage = error?.message || 'The selected file is too large to upload.';
      }
    }
  }

  private async prepareUploadFile(file: File): Promise<File> {
    if (file.size <= this.maxUploadBytes) {
      return file;
    }

    if (file.type === 'application/pdf') {
      throw new Error('PDF is too large. Please upload a PDF under 10MB.');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('File is too large to upload.');
    }

    const compressedImage = await this.compressImageToLimit(file, this.maxUploadBytes);
    if (compressedImage.size > this.maxUploadBytes) {
      throw new Error('Image is still too large after compression. Please use a smaller photo.');
    }
    return compressedImage;
  }

  private async compressImageToLimit(file: File, maxBytes: number): Promise<File> {
    const imageUrl = await this.readFileAsDataUrl(file);
    const image = await this.loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    // Reduce very large mobile captures before quality compression.
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    let quality = 0.85;
    let result = await this.canvasToFile(canvas, outputType, quality, file.name);

    while (result.size > maxBytes && quality > 0.35) {
      quality -= 0.1;
      result = await this.canvasToFile(canvas, outputType, quality, file.name);
    }

    return result;
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Failed to process selected image.'));
      image.src = src;
    });
  }

  private canvasToFile(canvas: HTMLCanvasElement, type: string, quality: number, fileName: string): Promise<File> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to compress image.'));
          return;
        }
        resolve(new File([blob], fileName, { type, lastModified: Date.now() }));
      }, type, quality);
    });
  }

  private getUploadErrorMessage(err: any): string {
    const backendMessage =
      err?.error?.message ||
      err?.error?.error ||
      err?.error?.status?.message ||
      err?.message;

    const message = backendMessage ? String(backendMessage) : 'Unknown upload error.';
    const lower = message.toLowerCase();

    if (
      lower.includes('upload failed') ||
      lower.includes('failed to upload') ||
      lower.includes('image upload failed')
    ) {
      return `${message} (Server may be rejecting file size. Check PHP upload_max_filesize and post_max_size.)`;
    }

    return message;
  }

  async confirmUpload() {
    if (!this.selectedFile || !this.selectedRoutine || !this.reflectionText) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select a file and enter your reflection.',
        confirmButtonColor: '#022F11'
      });
      return;
    }
    try {
      const response = await this.routinesService.submitRoutineCompletion(
        this.selectedRoutine.id,
        this.studentUserId,
        this.selectedFile,
        undefined, // routine task for legacy mode (optional)
        undefined, // intensity
        this.reflectionText
      ).toPromise();
      if (response && response.status !== 'success') throw new Error(response.message || 'Unknown error from API');
      await Swal.fire({
        icon: 'success',
        title: 'Routine Completed!',
        confirmButtonColor: '#022F11'
      });
      this.closeUploadModal();
      this.reflectionText = '';
      this.loadRoutineHistory();
    } catch(err:any) {
      console.error('[Legacy Upload] Upload error details:', err);
      const uploadErrorMessage = this.getUploadErrorMessage(err);
      await Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: uploadErrorMessage,
        confirmButtonColor: '#022F11'
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

  get filteredClassViews() {
    const term = (this.searchTerm || '').toLowerCase().trim();
    if (!term) return this.classViews;
    return this.classViews.filter(v => {
      const title = (v.title || v.classInfo?.title || '').toString().toLowerCase();
      const coach = (v.coach_username || v.classInfo?.coach_username || '').toString().toLowerCase();
      const sport = (v.classInfo?.sport || '').toString().toLowerCase();
      const desc = (v.description || '').toString().toLowerCase();
      return title.includes(term) || coach.includes(term) || sport.includes(term) || desc.includes(term);
    });
  }
}
