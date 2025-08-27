
import { Component, OnInit } from '@angular/core';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { RoutinesService, ClassInfo, RoutineHistory } from '../../services/routines.service';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs';

interface TaskData {
  task_id?: number;
  user_id?: number | null;
  title: string;
  date_due: string;
  time_due: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  description?: string | null;
  image?: string | null;
}

interface Event {
  image: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  attendees: number;
  status: string;
}

interface Vlog {
  id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  author: string;
  publishDate: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidenavComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  isNavOpen = true;
  activeSection: string = 'overview';
  
  // Task related properties
  tasks: TaskData[] = [];
  activeFilter: 'Pending' | 'In Progress' | 'Completed' = 'Pending';
  
  // Routine related properties
  enrolledClasses: ClassInfo[] = [];
  routineHistory: RoutineHistory[] = [];
  studentUsername = '';
  studentUserId: number | null = null;
  
  // Event related properties
  events: Event[] = [];
  isLoading = false;
  defaultImageUrl = 'https://placehold.co/400x300?text=No+Image';
  apiBaseUrl = 'http://localhost/demoproj1';

  constructor(
    private http: HttpClient, 
    private routinesService: RoutinesService
  ) {}

  ngOnInit() {
    // Get user info from localStorage
    const storedUsername = localStorage.getItem('username');
    if (storedUsername && storedUsername.trim().length > 0) {
      this.studentUsername = storedUsername;
  }
    const storedId = localStorage.getItem('hoa_user_id');
    this.studentUserId = storedId ? Number(storedId) : null;
    
    // Load all data
    this.fetchTasks();
    this.loadEnrolledClasses();
    this.loadEvents();
  }
 
  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  showSection(section: string) {
    this.activeSection = section;
  }

  // Task Methods (from task.component.ts)
  private fetchTasks() {
    const storedUserId = localStorage.getItem('hoa_user_id');
    const userId = storedUserId ? Number(storedUserId) : null;
    
    if (!userId) {
      console.error('No user ID found in localStorage');
      this.tasks = [];
      return;
    }
    
    const url = `${environment.apiUrl}/routes.php?request=getTasks&user_id=${userId}`;
    console.log('Fetching tasks from:', url);
    this.http.get<{ status?: string; payload?: TaskData[] } | any>(url).subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res)
          ? (res as TaskData[])
          : (res?.payload ?? []);
        this.tasks = this.sortByStatusPriority(raw);
        console.log('Fetched tasks:', this.tasks);
      },
      error: (err) => {
        console.error('Failed to load tasks', err);
        this.tasks = [];
      }
    });
  }

  get filteredTasks(): TaskData[] {
    const filtered = this.tasks.filter(t => this.activeFilter === t.status);
    return this.sortByStatusPriority(filtered);
  }

  setFilter(filter: 'Pending' | 'In Progress' | 'Completed') {
    this.activeFilter = filter;
  }

  private sortByStatusPriority(tasks: TaskData[]): TaskData[] {
    const priority: Record<string, number> = { 'Pending': 1, 'In Progress': 2, 'Completed': 3 };
    return [...tasks].sort((a, b) => {
      const pa = priority[a.status] ?? 999;
      const pb = priority[b.status] ?? 999;
      if (pa !== pb) return pa - pb;
      const ad = a.date_due ?? '';
      const bd = b.date_due ?? '';
      if (ad !== bd) return ad.localeCompare(bd);
      const at = a.time_due ?? '';
      const bt = b.time_due ?? '';
      return at.localeCompare(bt);
    });
  }

  // Routine Methods (from Routines.component.ts)
  async loadEnrolledClasses() {
    console.log('Loading classes for user_id:', this.studentUserId);
    
    try {
      if (!this.studentUserId) {
        throw new Error('Missing user_id');
      }
      const response = await this.routinesService.getEnrolledClassesById(this.studentUserId).toPromise();
      
      if (response && response.payload) {
        this.enrolledClasses = response.payload || [];
        console.log('Classes loaded successfully:', this.enrolledClasses);
        this.loadRoutineHistory();
      } else {
        this.enrolledClasses = [];
      }
    } catch (error: any) {
      console.error('Error loading classes:', error);
      this.enrolledClasses = [];
    }
  }

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

  // Check if routine is completed today
  isRoutineCompletedToday(classId: number): boolean {
    // Get current date in Philippine timezone (UTC+8)
    const philippineTime = new Date();
    philippineTime.setHours(philippineTime.getHours() + 8); // Adjust to Philippine time
    const today = philippineTime.toDateString();
    
    return this.routineHistory.some(history => 
      history.class_id === classId && 
      new Date(history.date_of_submission).toDateString() === today
    );
  }

  // Event Methods (from dashboard.component.ts)
  loadEvents() {
    this.isLoading = true;
    this.http.get(`${this.apiBaseUrl}/api/routes.php?request=getEvents`).pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(response => {
      if (response && (response as any).status === 'success') {
        this.events = ((response as any).data || []).map((event: Event) => {
          const imageUrl = event.image 
            ? (event.image.startsWith('http') ? event.image : `${this.apiBaseUrl}/api/uploads/events/${event.image}`)
            : this.defaultImageUrl;
          return {
            ...event,
            image: imageUrl
          };
        });
      }
    });
  }

  // Utility methods
  getTaskCount(status: 'Pending' | 'In Progress' | 'Completed'): number {
    return this.tasks.filter(task => task.status === status).length;
  }

  getCompletedRoutinesToday(): number {
    // Get current date in Philippine timezone (UTC+8)
    const philippineTime = new Date();
    philippineTime.setHours(philippineTime.getHours() + 8); // Adjust to Philippine time
    const today = philippineTime.toDateString();
    
    return this.routineHistory.filter(history => 
      new Date(history.date_of_submission).toDateString() === today
    ).length;
  }

  getUpcomingEvents(): Event[] {
    const today = new Date();
    return this.events.filter(event => new Date(event.date) > today).slice(0, 3);
  }

  // Get routine history for a specific class
  getRoutineHistoryForClass(classId: number): RoutineHistory[] {
    return this.routineHistory.filter(history => history.class_id === classId).slice(0, 3);
  }
}

