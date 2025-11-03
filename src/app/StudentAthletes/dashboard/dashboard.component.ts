import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { RoutinesService, ClassInfo, RoutineHistory } from '../../services/routines.service';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

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

interface TodayRoutine {
  className: string;
  task: string;
  intensity: string;
  isCompleted: boolean;
  classId: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, SidenavComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  isNavOpen = true;
  activeSection: string = 'overview';

  // Task related properties
  tasks: TaskData[] = [];
  activeFilter: 'Pending' | 'In Progress' | 'Completed' = 'Pending';

  // Routine related properties
  enrolledClasses: ClassInfo[] = [];
  routineHistory: RoutineHistory[] = [];
  todayRoutines: TodayRoutine[] = [];
  currentDayName: string = '';
  studentUsername = '';
  studentUserId: number | null = null;

  // Event related properties
  events: Event[] = [];
  isLoading = false;
  defaultImageUrl = 'https://placehold.co/400x300?text=No+Image';
  apiBaseUrl = 'http://localhost/demoproj1';

  // Charts
  private taskStatusChart: Chart | null = null;
  private routineTrendChart: Chart | null = null;
  private perClassBarChart: Chart | null = null;
  private completedTodayByClass: Map<number, boolean> = new Map();

  constructor(
    private http: HttpClient,
    private routinesService: RoutinesService
  ) {}

  ngOnInit(): void {
    // Get user info from localStorage
    const storedUsername = localStorage.getItem('username');
    if (storedUsername && storedUsername.trim().length > 0) {
      this.studentUsername = storedUsername;
    }
    const storedId = localStorage.getItem('hoa_user_id');
    this.studentUserId = storedId ? Number(storedId) : null;

    // Get current day name
    this.currentDayName = this.getCurrentDayName();

    // Load all data
    this.fetchTasks();
    this.loadEnrolledClasses();
    this.loadEvents();
  }

  ngOnDestroy(): void {
    // Clean up charts to prevent memory leaks
    this.taskStatusChart?.destroy();
    this.routineTrendChart?.destroy();
    this.perClassBarChart?.destroy();
  }

 
  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }
  showSection(section: string): void {
    this.activeSection = section;
  }

  // Get current day name
  getCurrentDayName(): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    return days[today.getDay()];
  }

  // Task Methods (from task.component.ts)
  private fetchTasks(): void {
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
        setTimeout(() => this.renderCharts(), 0);
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

  setFilter(filter: 'Pending' | 'In Progress' | 'Completed'): void {
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

  // Routine Methods
  async loadEnrolledClasses(): Promise<void> {
    console.log('Loading classes for user_id:', this.studentUserId);

    try {
      if (!this.studentUserId) {
        throw new Error('Missing user_id');
      }
      const response = await this.routinesService.getEnrolledClassesById(this.studentUserId).toPromise();

      if (response && response.payload) {
        this.enrolledClasses = response.payload || [];
        console.log('Classes loaded successfully:', this.enrolledClasses);
        // Ensure routine history is loaded, then compute today's routines and realtime completion
        await this.loadRoutineHistory();
        await this.loadTodayRoutines();
        await this.refreshRealtimeCompletion();
        this.renderCharts();
      } else {
        this.enrolledClasses = [];
      }
    } catch (error: any) {
      console.error('Error loading classes:', error);
      this.enrolledClasses = [];
    }
  }

  async loadTodayRoutines(): Promise<void> {
    this.todayRoutines = [];

    console.log('Loading today\'s routines...');
    console.log('Current day:', this.currentDayName);
    console.log('Enrolled classes:', this.enrolledClasses);

    for (const classInfo of this.enrolledClasses) {
      try {
        console.log(`Fetching routines for class ${classInfo.id}...`);
        const response = await this.routinesService.getClassRoutines(classInfo.id).toPromise();

        console.log('Full response:', response);
        console.log('Response payload:', response?.payload);

        if (response && response.payload) {
          const payload = response.payload;

          if (payload.weekly) {
            const weekly = payload.weekly;
            console.log('Weekly data found:', weekly);

            const todayData = weekly[this.currentDayName];
            console.log(`Data for ${this.currentDayName}:`, todayData);

            if (todayData && todayData.task && todayData.task.trim() !== '') {
              // Local check via already loaded history
              let isCompleted = this.isRoutineCompletedToday(this.currentDayName, classInfo.id);
              // Independent backend verification to ensure correctness
              try {
                const remote = await this.isCompletedTodayRemote(classInfo.id);
                isCompleted = isCompleted || remote;
              } catch {}

              console.log('Adding routine:', {
                className: payload.title || classInfo.title || 'Class',
                task: todayData.task,
                intensity: todayData.intensity,
                isCompleted: isCompleted
              });

              this.todayRoutines.push({
                className: payload.title || classInfo.title || 'Class',
                task: todayData.task,
                intensity: todayData.intensity,
                isCompleted: isCompleted,
                classId: classInfo.id
              });
            } else {
              console.log(`No task for ${this.currentDayName} or task is empty`);
            }
          } else {
            console.log('No weekly data in payload');
          }
        } else {
          console.log('Invalid response structure');
        }
      } catch (error) {
        console.error(`Error loading routines for class ${classInfo.id}:`, error);
      }
    }

    console.log('Final today\'s routines:', this.todayRoutines);
  }

  async loadRoutineHistory(): Promise<void> {
    try {
      const response = await this.routinesService.getRoutineHistory(this.studentUsername).toPromise();
      if (response && response.payload) {
        this.routineHistory = response.payload || [];
        // charts will be rendered after realtime completion refresh
        // If classes are already loaded, refresh today's routines to reflect completion
        if (this.enrolledClasses && this.enrolledClasses.length > 0) {
          await this.loadTodayRoutines();
          await this.refreshRealtimeCompletion();
          this.renderCharts();
        }
      } else {
        this.routineHistory = [];
      }
    } catch (error) {
      console.error('Error loading history:', error);
      this.routineHistory = [];
    }
  }

  isRoutineCompletedToday(day: string, classId: number): boolean {
    const philippineTime = new Date();
    philippineTime.setHours(philippineTime.getHours() + 8);
    const today = philippineTime.toDateString();

    return this.routineHistory.some(history => {
      const historyDate = new Date(history.date_of_submission);
      historyDate.setHours(historyDate.getHours() + 8);
      const historyDateString = historyDate.toDateString();

      return historyDateString === today &&
             history.class_id === classId &&
             history.routine.includes(day);
    });
  }

  isAnyRoutineCompletedTodayForClass(classId: number): boolean {
    const philippineTime = new Date();
    philippineTime.setHours(philippineTime.getHours() + 8);
    const today = philippineTime.toDateString();

    return this.routineHistory.some(history => {
      const historyDate = new Date(history.date_of_submission);
      historyDate.setHours(historyDate.getHours() + 8);
      const historyDateString = historyDate.toDateString();

      return historyDateString === today && history.class_id === classId;
    });
  }

  // Independent backend verification using dedicated API
  private async isCompletedTodayRemote(classId: number): Promise<boolean> {
    if (this.studentUserId != null) {
      try {
        const res = await this.routinesService.checkTodayRoutineById(classId, this.studentUserId).toPromise();
        const payload = (res && (res.payload ?? res.data)) || res;
        if (payload && typeof payload.completed === 'boolean') return payload.completed;
        if (res && res.status && res.status.remarks === 'success' && res.payload) return !!res.payload.completed;
      } catch {}
    }
    if (!this.studentUsername) return false;
    try {
      const res = await this.routinesService.checkTodayRoutine(classId, this.studentUsername).toPromise();
      const payload = (res && (res.payload ?? res.data)) || res;
      if (payload && typeof payload.completed === 'boolean') {
        return payload.completed;
      }
      // Some responses use {status:{remarks:'success'}, payload:{completed:true}}
      if (res && res.status && res.status.remarks === 'success' && res.payload) {
        return !!res.payload.completed;
      }
      return false;
    } catch {
      return false;
    }
  }

  loadEvents(): void {
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

  getTaskCount(status: 'Pending' | 'In Progress' | 'Completed'): number {
    return this.tasks.filter(task => task.status === status).length;
  }

  getCompletedRoutinesToday(): number {
    const philippineTime = new Date();
    philippineTime.setHours(philippineTime.getHours() + 8);
    const today = philippineTime.toDateString();

    return this.routineHistory.filter(history => {
      const historyDate = new Date(history.date_of_submission);
      historyDate.setHours(historyDate.getHours() + 8);
      return historyDate.toDateString() === today;
    }).length;
  }

  getUpcomingEvents(): Event[] {
    const today = new Date();
    return this.events.filter(event => new Date(event.date) > today).slice(0, 3);
  }

  getRoutineHistoryForClass(classId: number): RoutineHistory[] {
    return this.routineHistory.filter(history => history.class_id === classId).slice(0, 3);
  }

  private renderCharts(): void {
    this.renderTaskStatusChart();
    this.renderRoutineTrendChart();
    this.renderPerClassBarChart();
  }

  private renderTaskStatusChart(): void {
    const el = document.getElementById('taskStatusChart') as HTMLCanvasElement | null;
    if (!el) return;
    this.taskStatusChart?.destroy();
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const pending = this.getTaskCount('Pending');
    const inProgress = this.getTaskCount('In Progress');
    const completed = this.getTaskCount('Completed');
    this.taskStatusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'In Progress', 'Completed'],
        datasets: [{
          data: [pending, inProgress, completed],
          backgroundColor: ['#F59E0B', '#EAB308', '#15957F'],
          borderColor: ['#F59E0B', '#EAB308', '#0A7664'],
          borderWidth: 1
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  private renderRoutineTrendChart(): void {
    const el = document.getElementById('routineTrendChart') as HTMLCanvasElement | null;
    if (!el) return;
    this.routineTrendChart?.destroy();
    const ctx = el.getContext('2d');
    if (!ctx) return;

    const now = new Date();
    const labels: string[] = [];
    const values: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toDateString();
      labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      let count = this.routineHistory.filter(h => new Date(h.date_of_submission).toDateString() === key).length;
      const todayKey = new Date().toDateString();
      if (key === todayKey) {
        const delta = Array.from(this.completedTodayByClass.entries())
          .filter(([classId, done]) => done && !this.hasHistoryTodayForClass(classId))
          .length;
        count += delta;
      }
      values.push(count);
    }

    this.routineTrendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Routines Completed',
          data: values,
          borderColor: '#15957F',
          backgroundColor: 'rgba(21, 149, 127, 0.2)',
          fill: true,
          tension: 0.35,
          borderWidth: 2
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  private renderPerClassBarChart(): void {
    const el = document.getElementById('perClassBarChart') as HTMLCanvasElement | null;
    if (!el) return;
    this.perClassBarChart?.destroy();
    const ctx = el.getContext('2d');
    if (!ctx) return;

    const map = new Map<number, { name: string; count: number }>();
    for (const h of this.routineHistory) {
      const entry = map.get(h.class_id) || { name: String(h.class_id), count: 0 };
      entry.name = (this.enrolledClasses.find(c => c.id === h.class_id)?.title) || entry.name;
      entry.count += 1;
      map.set(h.class_id, entry);
    }
    // Add realtime completions not yet reflected in history
    for (const [classId, done] of this.completedTodayByClass.entries()) {
      if (!done) continue;
      if (this.hasHistoryTodayForClass(classId)) continue;
      const entry = map.get(classId) || { name: (this.enrolledClasses.find(c => c.id === classId)?.title) || String(classId), count: 0 };
      entry.count += 1;
      map.set(classId, entry);
    }
    const labels = Array.from(map.values()).map(v => v.name);
    const counts = Array.from(map.values()).map(v => v.count);

    this.perClassBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Completions (All Time)',
          data: counts,
          backgroundColor: '#15957F',
          borderColor: '#0A7664',
          borderWidth: 1
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });
  }

  private hasHistoryTodayForClass(classId: number): boolean {
    const today = new Date().toDateString();
    return this.routineHistory.some(h => new Date(h.date_of_submission).toDateString() === today && h.class_id === classId);
  }

  private async refreshRealtimeCompletion(): Promise<void> {
    this.completedTodayByClass.clear();
    for (const cls of this.enrolledClasses || []) {
      const done = await this.isCompletedTodayRemote(cls.id);
      this.completedTodayByClass.set(cls.id, !!done);
    }
  }
}

