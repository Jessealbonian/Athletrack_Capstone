import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { environment } from '../../../environments/environment';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RoutineClassRecord {
  class_id?: number;
  class_name?: string;
  description?: string;
  admin_id?: number;
  mondayRoutine?: string;
  tuesdayRoutine?: string;
  wednesdayRoutine?: string;
  thursdayRoutine?: string;
  fridayRoutine?: string;
  saturdayRoutine?: string;
  sundayRoutine?: string;
  mondayintensity?: string;
  tuesdayintensity?: string;
  wednesdayintensity?: string;
  thursdayintensity?: string;
  fridayintensity?: string;
  saturdayintensity?: string;
  sundayintensity?: string;
  created_at?: string;
}

interface AttendeeRecord {
  user_id?: number;
  name?: string;
  image?: string | null;
}

@Component({
  selector: 'app-routinehistory',
  standalone: true,
  imports: [CommonModule, FormsModule, SidenavComponent, NavbarComponent],
  templateUrl: './Routinehistory.component.html',
  styleUrls: ['./Routinehistory.component.css']
})
export class RoutinehistoryComponent implements OnInit {
  isNavOpen = true;
  isLoading = false;
  errorMessage: string | null = null;

  searchTerm = '';
  routines: RoutineClassRecord[] = [];
  expanded: Record<number, boolean> = {};

  // Modal state
  isModalOpen = false;
  selectedClass: RoutineClassRecord | null = null;
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1; // 1-12
  daysInMonth: number[] = [];
  selectedDay: number | null = null;
  isLoadingAttendees = false;
  attendeesForSelectedDay: AttendeeRecord[] = [];
  monthlyAttendanceCache: Map<number, AttendeeRecord[]> = new Map();

  // Attendees modal
  isAttendeesModalOpen = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchRoutineHistory();
  }

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  get filteredRoutines(): RoutineClassRecord[] {
    const term = (this.searchTerm || '').toLowerCase();
    if (!term) return this.routines;
    return this.routines.filter((r) => {
      const name = (r.class_name || '').toLowerCase();
      const desc = (r.description || '').toLowerCase();
      const created = (r.created_at || '').toLowerCase();
      return (
        name.includes(term) ||
        desc.includes(term) ||
        created.includes(term)
      );
    });
  }

  toggleExpand(id: number | undefined) {
    if (id == null) return;
    this.expanded[id] = !this.expanded[id];
  }

  openMonthModal(r: RoutineClassRecord) {
    this.selectedClass = r;
    const now = new Date();
    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth() + 1;
    this.daysInMonth = this.computeDaysInMonth(this.selectedYear, this.selectedMonth);
    this.selectedDay = null;
    this.attendeesForSelectedDay = [];
    this.monthlyAttendanceCache.clear();
    this.isModalOpen = true;
  }

  closeMonthModal() {
    this.isModalOpen = false;
    this.selectedClass = null;
    this.selectedDay = null;
    this.attendeesForSelectedDay = [];
    this.monthlyAttendanceCache.clear();
  }

  private computeDaysInMonth(year: number, month: number): number[] {
    const count = new Date(year, month, 0).getDate();
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  selectDay(day: number) {
    this.selectedDay = day;
    this.fetchAttendeesForDay(day);
  }

  private fetchAttendeesForDay(day: number) {
    if (!this.selectedClass?.class_id) return;
    this.isLoadingAttendees = true;
    const url = `${environment.apiUrl}/routes.php?request=getClassAttendance&class_id=${this.selectedClass.class_id}&year=${this.selectedYear}&month=${this.selectedMonth}&day=${day}`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        const raw = Array.isArray(res) ? res : (res?.data ?? res?.payload ?? []);
        const attendees: AttendeeRecord[] = (raw || []).map((a: any) => {
          const file = a.img ?? a.image ?? a.photo ?? null;
          const image = file
            ? (String(file).startsWith('http')
                ? String(file)
                : `${environment.apiUrl}/uploads/routines/${file}`)
            : null;
          return {
            user_id: a.user_id ?? a.id ?? null,
            name: a.name ?? a.username ?? 'Student',
            image
          } as AttendeeRecord;
        });
        this.attendeesForSelectedDay = attendees;
        this.monthlyAttendanceCache.set(day, attendees);
        this.isLoadingAttendees = false;
      },
      error: () => {
        this.attendeesForSelectedDay = [];
        this.monthlyAttendanceCache.set(day, []);
        this.isLoadingAttendees = false;
      }
    });
  }

  openAttendeesModal() {
    if (!this.selectedDay) return;
    this.isAttendeesModalOpen = true;
  }

  closeAttendeesModal() {
    this.isAttendeesModalOpen = false;
  }

  private async toDataURL(url: string): Promise<string> {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return '';
    }
  }

  async generateMonthlyReport() {
    if (!this.selectedClass?.class_id || !this.selectedDay) return;

    // Make sure attendees list is ready for the selected day
    const day = this.selectedDay;
    const list = this.monthlyAttendanceCache.get(day) || [];

    // Preload images as data URLs
    const images: string[] = await Promise.all(
      (list || []).map(async a => (a.image ? await this.toDataURL(a.image) : ''))
    );

    const doc = new jsPDF();
    const title = `Routine Attendance Report`;
    const sub = `${this.selectedClass.class_name || 'Class'} — ${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(12);
    doc.text(sub, 14, 26);

    type RowType = { name: string; img: string; };
    const body: RowType[] = (list || []).map((a, idx) => ({ name: a.name || 'Student', img: images[idx] }));

    const imageSizeMm = 13.2; // ~50px at 96DPI

    autoTable(doc, {
      startY: 32,
      head: [['Name', 'Image']],
      body: body.map(r => [r.name, '']),
      styles: { fontSize: 10, cellPadding: 3, minCellHeight: imageSizeMm + 4 },
      headStyles: { fillColor: [115, 93, 165] },
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: imageSizeMm + 6 } },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 1) {
          const rowIndex = data.row.index;
          const imgData = body[rowIndex]?.img;
          if (imgData) {
            const w = imageSizeMm;
            const h = imageSizeMm;
            const x = data.cell.x + (data.cell.width - w) / 2;
            const y = data.cell.y + (data.cell.height - h) / 2;
            try {
              (doc as any).addImage(imgData, 'PNG', x, y, w, h);
            } catch {}
          }
        }
      }
    });

    const fileName = `routine_report_${(this.selectedClass.class_name || 'class').toString().replace(/\s+/g, '_')}_${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}.pdf`;
    doc.save(fileName);
  }

  async generateWholeMonthReport() {
    if (!this.selectedClass?.class_id) return;

    // Ensure cache for each day
    const days = this.daysInMonth;
    const toFetch: number[] = days.filter(d => !this.monthlyAttendanceCache.has(d));
    if (toFetch.length > 0) {
      await Promise.all(
        toFetch.map(async (d) => new Promise<void>((resolve) => {
          const url = `${environment.apiUrl}/routes.php?request=getClassAttendance&class_id=${this.selectedClass?.class_id}&year=${this.selectedYear}&month=${this.selectedMonth}&day=${d}`;
          this.http.get<any>(url).subscribe({
            next: (res) => {
              const raw = Array.isArray(res) ? res : (res?.data ?? res?.payload ?? []);
              const attendees: AttendeeRecord[] = (raw || []).map((a: any) => {
                const file = a.img ?? a.image ?? a.photo ?? null;
                const image = file
                  ? (String(file).startsWith('http')
                      ? String(file)
                      : `${environment.apiUrl}/uploads/routines/${file}`)
                  : null;
                return {
                  user_id: a.user_id ?? a.id ?? null,
                  name: a.name ?? a.username ?? 'Student',
                  image
                } as AttendeeRecord;
              });
              this.monthlyAttendanceCache.set(d, attendees);
              resolve();
            },
            error: () => {
              this.monthlyAttendanceCache.set(d, []);
              resolve();
            }
          });
        }))
      );
    }

    // Build flat rows: Date, Name, Image
    const rows: { date: string; name: string; imageUrl: string | null }[] = [];
    for (const d of days) {
      const list = this.monthlyAttendanceCache.get(d) || [];
      const dateStr = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      for (const a of list) {
        rows.push({ date: dateStr, name: a.name || 'Student', imageUrl: a.image || null });
      }
      if (list.length === 0) {
        // Still show the day with no attendees
        rows.push({ date: dateStr, name: '(none)', imageUrl: null });
      }
    }

    // Preload all images
    const images: string[] = await Promise.all(
      rows.map(async r => (r.imageUrl ? await this.toDataURL(r.imageUrl) : ''))
    );

    const doc = new jsPDF();
    const title = `Routine Attendance Report (Whole Month)`;
    const sub = `${this.selectedClass.class_name || 'Class'} — ${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}`;
    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(12);
    doc.text(sub, 14, 26);

    const imageSizeMm = 13.2; // ~50px at 96DPI

    autoTable(doc, {
      startY: 32,
      head: [['Date', 'Name', 'Image']],
      body: rows.map(() => ['', '', '']),
      styles: { fontSize: 10, cellPadding: 3, minCellHeight: imageSizeMm + 4 },
      headStyles: { fillColor: [115, 93, 165] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 100 },
        2: { cellWidth: imageSizeMm + 6 }
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const idx = data.row.index;
          if (data.column.index === 0) data.cell.text = [rows[idx].date];
          if (data.column.index === 1) data.cell.text = [rows[idx].name];
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 2) {
          const idx = data.row.index;
          const imgData = images[idx];
          if (imgData) {
            const w = imageSizeMm;
            const h = imageSizeMm;
            const x = data.cell.x + (data.cell.width - w) / 2;
            const y = data.cell.y + (data.cell.height - h) / 2;
            try {
              (doc as any).addImage(imgData, 'PNG', x, y, w, h);
            } catch {}
          }
        }
      }
    });

    const fileName = `routine_report_month_${(this.selectedClass.class_name || 'class').toString().replace(/\s+/g, '_')}_${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}.pdf`;
    doc.save(fileName);
  }

  private fetchRoutineHistory(): void {
    this.isLoading = true;
    this.errorMessage = null;
    const url = `${environment.apiUrl}/routes.php?request=getClasses`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        const raw = Array.isArray(res) ? res : (res?.data ?? res?.payload ?? []);
        const normalized: RoutineClassRecord[] = (raw || []).map((r: any) => ({ ...r }));
        this.routines = normalized.sort((a, b) => (b.class_id ?? 0) - (a.class_id ?? 0));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load class routines', err);
        this.errorMessage = 'Failed to load routine history. Please try again later.';
        this.isLoading = false;
      },
    });
  }
}

