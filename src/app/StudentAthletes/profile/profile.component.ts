import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { AuthService } from '../../auth.service';
import { RoutinesService, ClassInfo, RoutineHistory } from '../../services/routines.service';
import { FormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [SidenavComponent, NavbarComponent, CommonModule, FormsModule],
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
  reportYear: number | 'all' = 'all';
  reportMonth: number | 'all' = 'all';
  reportWeek: number | 'all' = 'all';

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
      this.loadProfileById();
      await this.loadClassesAndHistory();
    });
  }

  private loadProfileById() {
    if (!this.userId) return;
    this.routinesService.getHoaUserProfById(this.userId).subscribe({
      next: (resp: any) => {
        const row = resp?.data?.[0] ?? resp?.payload?.[0] ?? null;
        if (row) {
          this.profile = row;
        }
      }
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

  get availableYears(): number[] {
    const years = new Set<number>();
    for (const item of this.routineHistory) {
      const dt = new Date(item.date_of_submission);
      if (!isNaN(dt.getTime())) years.add(dt.getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }

  get filteredRoutineHistory(): RoutineHistory[] {
    return this.routineHistory.filter((item) => {
      const dt = new Date(item.date_of_submission);
      if (isNaN(dt.getTime())) return false;

      if (this.reportYear !== 'all' && dt.getFullYear() !== this.reportYear) return false;
      if (this.reportMonth !== 'all' && (dt.getMonth() + 1) !== this.reportMonth) return false;

      if (this.reportWeek !== 'all') {
        const dayOfMonth = dt.getDate();
        const weekOfMonth = Math.ceil(dayOfMonth / 7);
        if (weekOfMonth !== this.reportWeek) return false;
      }
      return true;
    });
  }

  generateReportPdf() {
    const rows = this.filteredRoutineHistory;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`${this.profile?.username || 'Student'} - Completed Routines Report`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Filter: Year=${this.reportYear} Month=${this.reportMonth} Week=${this.reportWeek}`, 14, 23);

    autoTable(doc, {
      startY: 28,
      head: [['Date/Time', 'Routine', 'Intensity', 'Reflection', 'Coach Response']],
      body: rows.length
        ? rows.map((r) => [
            this.getDisplayDateTime(r) || '-',
            r.routine || '-',
            r.routine_intensity || '-',
            r.student_reflection || '-',
            r.coach_response || '-'
          ])
        : [['No records found for selected filters', '', '', '', '']]
    });

    doc.save('completed_routines_report.pdf');
  }
}
