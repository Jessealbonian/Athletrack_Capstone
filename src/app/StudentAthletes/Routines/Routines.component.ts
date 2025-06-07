import { Component, OnInit } from '@angular/core';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TaskData {
  title: string;
  dueDate: string;
  dueTime: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}

@Component({
  selector: 'app-Routines',
  standalone: true,
  imports: [SidenavComponent, NavbarComponent, CommonModule, FormsModule],
  templateUrl: './Routines.component.html',
  styleUrl: './Routines.component.css'
})
export class RoutinesComponent implements OnInit {
  isNavOpen = true;
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

  uploadedDocuments = ['Document1.pdf', 'Document2.pdf', 'Document3.pdf'];

  constructor() {}

  ngOnInit() {}

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
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
