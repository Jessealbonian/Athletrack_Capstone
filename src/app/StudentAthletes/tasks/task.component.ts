import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth.service';
import { environment } from '../../../environments/environment';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, SidenavComponent, NavbarComponent],
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.css']
})
export class TaskComponent implements OnInit {
  isNavOpen = true;
  studentProfile: any = null;
  enrolledClasses: any[] = [];
  routineHistory: any[] = [];

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit() {
    this.auth.getCurrentUser().subscribe((user: any) => {
      if (user) {
        this.studentProfile = user;
        this.fetchEnrolledClasses(user.user_id);
        this.fetchRoutineHistory(user.username);
      }
    });
  }

  onNavToggled(isOpen: boolean | Event) {
    if (typeof isOpen === 'boolean') {
      this.isNavOpen = isOpen;
    }
  }

  fetchEnrolledClasses(userId: number) {
    this.http.get(`${environment.apiUrl}/routes.php?request=enrolled-classes/id/${userId}`).subscribe((res: any) => {
      this.enrolledClasses = res?.payload || [];
    });
  }

  fetchRoutineHistory(username: string) {
    this.http.get(`${environment.apiUrl}/routes.php?request=routine-history/${username}`).subscribe((res: any) => {
      this.routineHistory = res?.payload || [];
    });
  }
}