import { Component, OnInit } from '@angular/core';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiResponse } from '../../Coaches/services/residents.service';
import Swal from 'sweetalert2';
import { catchError } from 'rxjs/operators';
import { ResidentsService } from '../../Coaches/services/residents.service';
import { MaintenanceService, MaintenanceRequest } from './maintenance.service';

interface TaskData {
  title: string;
  dueDate: string;
  dueTime: string;
  status: 'Pending' | 'In Progress' | 'Completed';
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
  
  newTask: TaskData = {
    title: '',
    dueDate: '',
    dueTime: '',
    status: 'Pending'
  };

  constructor() { }

  ngOnInit() { }

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
}