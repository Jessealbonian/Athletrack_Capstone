import { Component, OnInit } from '@angular/core';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

interface TaskData {
  task_id?: number;
  user_id?: number | null;
  title: string;
  date_due: string; // yyyy-MM-dd
  time_due: string; // HH:mm
  status: 'Pending' | 'In Progress' | 'Completed';
  description?: string | null;
  image?: string | null;
}

@Component({
  selector: 'app-task',
  standalone: true,
  imports: [
    SidenavComponent,
    NavbarComponent,
    FormsModule,
    CommonModule
  ],
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css']
})
export class taskComponent implements OnInit {
  isNavOpen = true;
  showAddTaskModal = false;
  showEditStatusModal = false;
  isEditing = false;
  editingTaskId: number | null = null;
  tasks: TaskData[] = [];
  activeFilter: 'Pending' | 'In Progress' | 'Completed' = 'Pending';
  editStatus: 'Pending' | 'In Progress' | 'Completed' = 'Pending';
  editImage: File | null = null;
  
  newTask: TaskData = {
    title: '',
    date_due: '',
    time_due: '',
    status: 'Pending'
  };

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.fetchTasks();
  }

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  openAddTaskModal() {
    const storedUserId = localStorage.getItem('hoa_user_id');
    this.newTask.user_id = storedUserId ? Number(storedUserId) : null;
    this.showAddTaskModal = true;
    this.isEditing = false;
    this.editingTaskId = null;
  }

  closeAddTaskModal() {
    this.showAddTaskModal = false;
    this.resetTaskForm();
  }

  async confirmAddTask() {
    const url = this.isEditing
      ? `${environment.apiUrl}/routes.php?request=updateTask`
      : `${environment.apiUrl}/routes.php?request=addTask`;

    // Sanitize data in-place and send directly
    this.newTask.title = (this.newTask.title || '').trim();
    this.newTask.date_due = (this.newTask.date_due || '').trim();
    this.newTask.time_due = (this.newTask.time_due || '').trim();
    this.newTask.description = this.newTask.description?.toString().trim() || null;
    this.newTask.image = this.newTask.image?.toString().trim() || null;
    this.newTask.user_id = this.newTask.user_id ?? null;

    // Ask confirmation when adding using SweetAlert
    if (!this.isEditing) {
      const res = await Swal.fire({
        title: 'Add this task?',
        text: 'Please confirm you want to add this task.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, add it',
        cancelButtonText: 'Cancel'
      });
      if (!res.isConfirmed) return;
    }

    console.group(this.isEditing ? 'Update Task POST' : 'Add Task POST');
    console.log('URL:', url);
    console.log('Posting newTask:', this.newTask);
    console.groupEnd();

    const body = this.isEditing ? { ...this.newTask, task_id: this.editingTaskId } : this.newTask;

    this.http.post(url, body).subscribe({
      next: (res) => {
        console.log('Task save response:', res);
        this.closeAddTaskModal();
        this.fetchTasks();
        Swal.fire({
          icon: 'success',
          title: this.isEditing ? 'Task updated' : 'Task added',
          timer: 1200,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('Failed to save task', err);
        Swal.fire({
          icon: 'error',
          title: 'Failed to save task',
          text: 'Please try again later.'
        });
      }
    });
  }

  private resetTaskForm() {
    const storedUserId = localStorage.getItem('hoa_user_id');
    this.newTask = {
      title: '',
      date_due: '',
      time_due: '',
      status: 'Pending',
      description: null,
      image: null,
      user_id: storedUserId ? Number(storedUserId) : null
    };
  }

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
        // Support both sendPayload structure and raw array
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

  // Computed filtered list based on active filter
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
      // Then by date and time ascending
      const ad = a.date_due ?? '';
      const bd = b.date_due ?? '';
      if (ad !== bd) return ad.localeCompare(bd);
      const at = a.time_due ?? '';
      const bt = b.time_due ?? '';
      return at.localeCompare(bt);
    });
  }

  openEditTask(task: TaskData) {
    this.isEditing = true;
    this.editingTaskId = task.task_id ?? null;
    this.editStatus = task.status;
    this.editImage = null;
    this.showEditStatusModal = true;
  }

  onEditFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    this.editImage = input.files && input.files.length > 0 ? input.files[0] : null;
  }

  submitEditStatus() {
    if (this.editingTaskId == null) return;
    const url = `${environment.apiUrl}/routes.php?request=updateTask`;

    // If completing, require screenshot
    if (this.editStatus === 'Completed' && !this.editImage) {
      Swal.fire({
        icon: 'warning',
        title: 'Screenshot required',
        text: 'Please upload a screenshot to confirm completion.'
      });
      return;
    }

            // When image is provided, use FormData for upload
        if (this.editImage) {
          const form = new FormData();
          form.append('task_id', String(this.editingTaskId || ''));
          form.append('status', this.editStatus);
          form.append('image', this.editImage);
          this.http.post(url, form).subscribe({
            next: (res: any) => {
              console.log('Status update with image response:', res);
              this.cancelEdit();
              this.fetchTasks();
              
              // Show success message with image if available
              if (res.image_url) {
                Swal.fire({
                  icon: 'success',
                  title: 'Task completed',
                  text: 'Screenshot uploaded successfully!',
                  imageUrl: res.image_url,
                  imageWidth: 300,
                  imageHeight: 200,
                  imageAlt: 'Uploaded Task Image',
                  timer: 3000,
                  showConfirmButton: false
                });
              } else {
                Swal.fire({
                  icon: 'success',
                  title: 'Task completed',
                  text: 'Screenshot uploaded successfully.',
                  timer: 1400,
                  showConfirmButton: false
                });
              }
            },
        error: (err) => {
          console.error('Failed to update task status with image', err);
          Swal.fire({
            icon: 'error',
            title: 'Update failed',
            text: 'Could not complete the task. Please try again.'
          });
        }
      });
      return;
    }

    // Otherwise, simple JSON update
    const body = { task_id: this.editingTaskId, status: this.editStatus } as any;
    this.http.post(url, body).subscribe({
      next: (res) => {
        console.log('Status update response:', res);
        this.cancelEdit();
        this.fetchTasks();
        Swal.fire({
          icon: 'success',
          title: 'Status updated',
          timer: 1200,
          showConfirmButton: false
        });
      },
      error: (err) => {
        console.error('Failed to update task status', err);
        Swal.fire({
          icon: 'error',
          title: 'Update failed',
          text: 'Please try again later.'
        });
      }
    });
  }

  cancelEdit() {
    this.showEditStatusModal = false;
    this.isEditing = false;
    this.editingTaskId = null;
    this.editStatus = 'Pending';
    this.editImage = null;
  }

  // Open image modal to display uploaded task screenshots
  openImageModal(imageUrl: string, taskTitle: string) {
    Swal.fire({
      title: `Screenshot for: ${taskTitle}`,
      imageUrl: imageUrl,
      imageWidth: 600,
      imageHeight: 400,
      imageAlt: `Task completion screenshot for ${taskTitle}`,
      confirmButtonText: 'Close',
      confirmButtonColor: '#0A7664'
    });
  }
}