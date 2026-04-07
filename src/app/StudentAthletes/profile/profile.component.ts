import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService } from '../../auth.service';
import { RoutinesService, ClassInfo, RoutineHistory } from '../../services/routines.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [SidenavComponent, NavbarComponent, CommonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  userId = 0;
  profile: any;
  enrolledClasses: ClassInfo[] = [];
  routineHistory: RoutineHistory[] = [];
  isLoadingClasses = false;
  isLoadingHistory = false;
  isNavOpen = true;

  constructor(private auth: AuthService, private routinesService: RoutinesService) {}

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  ngOnInit() {
    this.auth.getCurrentUser().subscribe(async (user: any) => {
      if (!user) {
        this.profile = null;
        return;
      }

      this.userId = user.id;
      this.profile = user;
      await this.loadClassesAndHistory();
    });
  }

  private async loadClassesAndHistory() {
    if (!this.userId) return;

    this.isLoadingClasses = true;
    try {
      const classResponse = await this.routinesService.getEnrolledClassesById(this.userId).toPromise();
      this.enrolledClasses = classResponse?.payload || [];
    } catch {
      this.enrolledClasses = [];
    } finally {
      this.isLoadingClasses = false;
    }

    this.isLoadingHistory = true;
    try {
      const historyRequests = this.enrolledClasses.map((cls) =>
        this.routinesService.getRoutineHistoryForStudentInClass(cls.id, this.userId).toPromise()
      );
      const responses = await Promise.all(historyRequests);
      const merged: RoutineHistory[] = [];

      for (let i = 0; i < responses.length; i++) {
        const className = this.enrolledClasses[i]?.title || `Class ${this.enrolledClasses[i]?.id}`;
        const rows = responses[i]?.payload || [];
        for (const row of rows) {
          merged.push({ ...row, class_name: row.class_name || className });
        }
      }

      this.routineHistory = merged.sort((a, b) => {
        const aDt = `${a.date_of_submission || ''} ${a.time_of_submission || ''}`;
        const bDt = `${b.date_of_submission || ''} ${b.time_of_submission || ''}`;
        return bDt.localeCompare(aDt);
      });
    } catch {
      this.routineHistory = [];
    } finally {
      this.isLoadingHistory = false;
    }
  }

  getDisplayDateTime(item: RoutineHistory): string {
    return `${item.date_of_submission || ''} ${item.time_of_submission || ''}`.trim();
  }

  getImageUrl(img?: string): string {
    if (!img) return '';
    if (img.startsWith('http')) return img;
    return `https://capstonebackend-9wrj.onrender.com/api/uploads/routines/${img}`;
  }
}
