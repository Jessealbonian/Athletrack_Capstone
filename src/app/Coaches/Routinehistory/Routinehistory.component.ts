import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { environment } from '../../../environments/environment';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthService } from '../../auth.service';
import Swal from 'sweetalert2';

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
  student_email?: string | null;
  image?: string | null;
  routine?: string;
  routine_intensity?: string;
  time_of_submission?: string;
  student_reflection?: string | null;
  coach_response?: string | null;
  status?: 'active' | 'inactive';
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
  currentAdminId: number | null = null;

  searchTerm = '';
  routines: RoutineClassRecord[] = [];

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

  // Day details modal
  isDayDetailsModalOpen = false;
  attendeeStatusFilter: 'all' | 'active' | 'inactive' = 'all';
  get filteredAttendeesForSelectedDay() {
    if (this.attendeeStatusFilter === 'all') return this.attendeesForSelectedDay;
    return this.attendeesForSelectedDay.filter((a: any) => a.status === this.attendeeStatusFilter);
  }

  // Report dropdown
  isReportMenuOpen = false;

  attendeeHistoryModalOpen = false;
  selectedAttendeeHistory: any[] = [];
  selectedAttendee: any = null;
  attendeeCoachResponseDraft: Record<number, string> = {};
  isSavingAttendeeCoachResponse: Record<number, boolean> = {};
  activeAttendeeHistoryEntryId: number | null = null;
  onAttendeeClick(attendee: any) {
    this.selectedAttendee = attendee;
    this.attendeeHistoryModalOpen = true;
    this.attendeeCoachResponseDraft = {};
    this.isSavingAttendeeCoachResponse = {};
    this.activeAttendeeHistoryEntryId = null;
    const url = `${environment.apiUrl}/routes.php?request=getRoutineHistoryForStudentInClass&class_id=${this.selectedClass?.class_id}&user_id=${attendee.user_id}`;
    this.http.get<any>(url).subscribe(res => {
      this.selectedAttendeeHistory = res?.payload || [];
      for (const entry of this.selectedAttendeeHistory) {
        if (entry?.id != null) {
          this.attendeeCoachResponseDraft[entry.id] = entry.coach_response || '';
        }
      }
    });
  }
  closeAttendeeHistoryModal() {
    this.attendeeHistoryModalOpen = false;
    this.selectedAttendee = null;
    this.selectedAttendeeHistory = [];
    this.attendeeCoachResponseDraft = {};
    this.isSavingAttendeeCoachResponse = {};
    this.activeAttendeeHistoryEntryId = null;
  }

  setActiveAttendeeHistoryEntry(entry: any) {
    const id = Number(entry?.id);
    this.activeAttendeeHistoryEntryId = id || null;
  }

  saveAttendeeCoachResponse(entry: any) {
    const historyId = Number(entry?.id);
    if (!historyId) return;
    const text = (this.attendeeCoachResponseDraft[historyId] || '').toString().trim();

    this.isSavingAttendeeCoachResponse[historyId] = true;
    this.http.post(`${environment.apiUrl}/routes.php?request=setCoachResponse`, {
      history_id: historyId,
      coach_response: text
    }).subscribe({
      next: (resp: any) => {
        if (resp?.status === 'success') {
          entry.coach_response = text;
          Swal.fire({ icon: 'success', title: 'Saved', text: 'Coach response saved.' });
        } else {
          Swal.fire({ icon: 'error', title: 'Error', text: resp?.message || 'Failed to save response.' });
        }
        this.isSavingAttendeeCoachResponse[historyId] = false;
      },
      error: () => {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to save response.' });
        this.isSavingAttendeeCoachResponse[historyId] = false;
      }
    });
  }

  constructor(private http: HttpClient, private auth: AuthService) {}

  ngOnInit(): void {
    // Capture current admin id from auth (same source used by navbar)
    this.auth.getCurrentUser().subscribe((user: any) => {
      this.currentAdminId = user?.id ?? null;
      // Once we have admin id, load classes filtered to this admin
      this.fetchRoutineHistory();
    });
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

  openMonthModal(r: RoutineClassRecord) {
    this.selectedClass = r;
    const now = new Date();
    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth() + 1;
    this.daysInMonth = this.computeDaysInMonth(this.selectedYear, this.selectedMonth);
    this.selectedDay = null;
    this.attendeesForSelectedDay = [];
    this.monthlyAttendanceCache.clear();
    this.attendeeStatusFilter = 'all';
    this.isReportMenuOpen = false;
    this.isDayDetailsModalOpen = false;
    this.isModalOpen = true;
    // Prevent background scrolling
    document.body.classList.add('modal-open');
  }

  closeMonthModal() {
    this.isModalOpen = false;
    this.selectedClass = null;
    this.selectedDay = null;
    this.attendeesForSelectedDay = [];
    this.monthlyAttendanceCache.clear();
    this.isReportMenuOpen = false;
    this.isDayDetailsModalOpen = false;
    // Restore background scrolling
    document.body.classList.remove('modal-open');
  }

  goToPrevMonth() {
    // Decrement month; wrap year when going below January
    if (this.selectedMonth === 1) {
      this.selectedMonth = 12;
      this.selectedYear -= 1;
    } else {
      this.selectedMonth -= 1;
    }
    this.daysInMonth = this.computeDaysInMonth(this.selectedYear, this.selectedMonth);
    this.selectedDay = null;
    this.attendeesForSelectedDay = [];
    this.monthlyAttendanceCache.clear();
  }

  goToNextMonth() {
    // Increment month; wrap year when passing December
    if (this.selectedMonth === 12) {
      this.selectedMonth = 1;
      this.selectedYear += 1;
    } else {
      this.selectedMonth += 1;
    }
    this.daysInMonth = this.computeDaysInMonth(this.selectedYear, this.selectedMonth);
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
    this.openDayDetailsModal(day);
  }

  private fetchAttendeesForDay(day: number) {
    if (!this.selectedClass?.class_id) return;
    this.isLoadingAttendees = true;
    const url = `${environment.apiUrl}/routes.php?request=getClassRosterByDate&class_id=${this.selectedClass.class_id}&year=${this.selectedYear}&month=${this.selectedMonth}&day=${day}`;
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
          const rawStatus = (a.status ?? a.student_status ?? '').toString().toLowerCase().trim();
          const status: 'active' | 'inactive' = rawStatus === 'active' ? 'active' : 'inactive';
          return {
            user_id: a.user_id ?? a.id ?? null,
            name: a.name ?? a.username ?? 'Student',
            student_email: a.student_email ?? a.email ?? null,
            image,
            routine: a.routine || '',
            routine_intensity: a.routine_intensity || '',
            time_of_submission: a.time_of_submission || '',
            student_reflection: a.student_reflection ?? null,
            coach_response: a.coach_response ?? null,
            status
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

  openDayDetailsModal(day: number) {
    this.selectedDay = day;
    this.isDayDetailsModalOpen = true;
    this.attendeeStatusFilter = 'all';
    // Use cache if available
    const cached = this.monthlyAttendanceCache.get(day);
    if (cached) {
      this.attendeesForSelectedDay = cached;
      this.isLoadingAttendees = false;
      return;
    }
    this.fetchAttendeesForDay(day);
  }

  closeDayDetailsModal() {
    this.isDayDetailsModalOpen = false;
    this.attendeeStatusFilter = 'all';
  }

  setYear(y: number) {
    this.selectedYear = y;
    this.daysInMonth = this.computeDaysInMonth(this.selectedYear, this.selectedMonth);
    this.selectedDay = null;
    this.attendeesForSelectedDay = [];
    this.monthlyAttendanceCache.clear();
    this.isDayDetailsModalOpen = false;
  }

  setMonth(m: number) {
    this.selectedMonth = m;
    this.daysInMonth = this.computeDaysInMonth(this.selectedYear, this.selectedMonth);
    this.selectedDay = null;
    this.attendeesForSelectedDay = [];
    this.monthlyAttendanceCache.clear();
    this.isDayDetailsModalOpen = false;
  }

  get availableYears(): number[] {
    const now = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => now - i);
  }

  get months(): { value: number; label: string }[] {
    return [
      { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
      { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
      { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
      { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' }
    ];
  }

  toggleReportMenu() {
    this.isReportMenuOpen = !this.isReportMenuOpen;
  }

  closeReportMenu() {
    this.isReportMenuOpen = false;
  }

  async generateDayReportPrompt() {
    if (!this.selectedDay) return;

    const choice = await Swal.fire({
      title: 'Generate report for…',
      input: 'select',
      inputOptions: {
        all: 'All',
        active: 'Active',
        inactive: 'Inactive'
      },
      inputValue: 'all',
      showCancelButton: true,
      confirmButtonText: 'Generate',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#0A7664'
    });

    if (!choice.isConfirmed) return;
    await this.generateMonthlyReport(choice.value as any);
  }

  formatTime12h(timeStr: any): string {
    const raw = String(timeStr ?? '').trim();
    if (!raw) return '-';
    const timePart = raw.includes(' ') ? raw.split(' ').pop() || '' : raw;
    const m = timePart.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!m) return timePart;
    let h = Number(m[1]);
    const min = m[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${min} ${ampm}`;
  }

  async generateYearlyReport() {
    if (!this.selectedClass?.class_id) return;

    const year = this.selectedYear;
    type YearRow = {
      date: string;
      name: string;
      email: string;
      routine: string;
      intensity: string;
      time: string;
      reflection: string;
      coach: string;
      imageUrl: string | null;
    };
    const rows: YearRow[] = [];

    for (let month = 1; month <= 12; month++) {
      const days = this.computeDaysInMonth(year, month);
      for (const day of days) {
        // eslint-disable-next-line no-await-in-loop
        const list: AttendeeRecord[] = await new Promise((resolve) => {
          const url = `${environment.apiUrl}/routes.php?request=getClassAttendance&class_id=${this.selectedClass?.class_id}&year=${year}&month=${month}&day=${day}`;
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
                const rawStatus = (a.status ?? a.student_status ?? '').toString().toLowerCase().trim();
                const status: 'active' | 'inactive' = rawStatus === 'active' ? 'active' : 'inactive';
                return {
                  user_id: a.user_id ?? a.id ?? null,
                  name: a.name ?? a.username ?? 'Student',
                  student_email: a.student_email ?? a.email ?? null,
                  image,
                  routine: a.routine || '',
                  routine_intensity: a.routine_intensity || '',
                  time_of_submission: a.time_of_submission || '',
                  student_reflection: a.student_reflection ?? null,
                  coach_response: a.coach_response ?? null,
                  status
                } as AttendeeRecord;
              });
              resolve(attendees);
            },
            error: () => resolve([])
          });
        });

        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (list.length === 0) {
          rows.push({
            date: dateStr,
            name: '(none)',
            email: '—',
            routine: 'N/A',
            intensity: 'N/A',
            time: 'N/A',
            reflection: '—',
            coach: '—',
            imageUrl: null
          });
        } else {
          for (const a of list) {
            rows.push({
              date: dateStr,
              name: a.name || 'Student',
              email: a.student_email || '—',
              routine: a.routine || 'N/A',
              intensity: a.routine_intensity || 'N/A',
              time: this.formatTime12h(a.time_of_submission) || 'N/A',
              reflection: this.clipPdfText(a.student_reflection || '—', 320),
              coach: this.clipPdfText(a.coach_response || '—', 320),
              imageUrl: a.image || null
            });
          }
        }
      }
    }

    const images: string[] = await Promise.all(rows.map(async r => (r.imageUrl ? await this.toDataURL(r.imageUrl) : '')));

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(10, 118, 100);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text('Athletrack — Routine history (yearly)', 14, 13);
    doc.setFontSize(10);
    doc.text(`${this.selectedClass.class_name || 'Class'} · ${year}`, 14, 19);
    doc.setTextColor(0, 0, 0);

    const logged = rows.filter(r => r.name !== '(none)').length;
    doc.setFontSize(10);
    doc.text(
      `There are ${logged} submission row${logged === 1 ? '' : 's'} with athlete reflections and coach responses where captured. Placeholder rows mark days with no uploads.`,
      14,
      30,
      { maxWidth: pageW - 28 }
    );

    const activeLike = rows.filter(r => r.name !== '(none)').length;
    const inactiveLike = rows.filter(r => r.name === '(none)').length;
    this.drawRoutineDayMixBarPdf(doc, 14, 38, activeLike, inactiveLike);

    const imageSizeMm = 12;
    autoTable(doc, {
      startY: 54,
      head: [['Date', 'Athlete', 'Email', 'Exercise', 'Intensity', 'Time', 'Reflection', 'Coach response', 'Photo']],
      body: rows.map(() => new Array(9).fill('')),
      styles: { fontSize: 6.5, cellPadding: 1.2, overflow: 'linebreak', minCellHeight: imageSizeMm + 3 },
      headStyles: { fillColor: [10, 118, 100], fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 28 },
        2: { cellWidth: 32 },
        3: { cellWidth: 38 },
        4: { cellWidth: 18 },
        5: { cellWidth: 18 },
        6: { cellWidth: 42 },
        7: { cellWidth: 42 },
        8: { cellWidth: imageSizeMm + 5 }
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const idx = data.row.index;
          const r = rows[idx];
          const cells = [
            r.date,
            r.name,
            r.email,
            r.routine,
            r.intensity,
            r.time,
            r.reflection,
            r.coach,
            ''
          ];
          const col = data.column.index;
          if (col >= 0 && col < 8) {
            data.cell.text = [cells[col]];
          }
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 8) {
          const idx = data.row.index;
          const imgData = images[idx];
          if (imgData) {
            const w = imageSizeMm;
            const h = imageSizeMm;
            const x = data.cell.x + (data.cell.width - w) / 2;
            const y = data.cell.y + (data.cell.height - h) / 2;
            try {
              (doc as any).addImage(imgData, 'PNG', x, y, w, h);
            } catch {
              /* ignore */
            }
          }
        }
      }
    });

    const fileName = `routine_report_year_${(this.selectedClass.class_name || 'class').toString().replace(/\s+/g, '_')}_${year}.pdf`;
    doc.save(fileName);
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

  async generateMonthlyReport(filter: 'all' | 'active' | 'inactive' = 'all') {
    if (!this.selectedClass?.class_id || !this.selectedDay) return;

    const day = this.selectedDay;
    const base = this.monthlyAttendanceCache.get(day) || [];
    const list = filter === 'all' ? base : base.filter(a => (a.status || 'active') === filter);

    const images: string[] = await Promise.all(
      (list || []).map(async a => (a.image ? await this.toDataURL(a.image) : ''))
    );

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageW = doc.internal.pageSize.getWidth();
    const dateLabel = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    doc.setFillColor(2, 47, 17);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text('Athletrack — Routine day report', 14, 13);
    doc.setFontSize(10);
    doc.text(`${this.selectedClass.class_name || 'Class'} · ${dateLabel}`, 14, 19);
    doc.setTextColor(0, 0, 0);

    const activeC = list.filter(a => (a.status || 'active') === 'active').length;
    const inactiveC = list.filter(a => (a.status || 'active') === 'inactive').length;
    const scope =
      filter === 'all' ? 'all roster statuses' : filter === 'active' ? 'active submissions only' : 'inactive / no submission rows';

    doc.setFontSize(10);
    doc.text(
      `There ${list.length === 1 ? 'is' : 'are'} ${list.length} athlete row${list.length === 1 ? '' : 's'} on ${dateLabel} (${scope}). Each row includes proof photo, prescribed exercise, athlete reflection, and coach response when stored.`,
      14,
      30,
      { maxWidth: pageW - 28 }
    );
    this.drawRoutineDayMixBarPdf(doc, 14, 42, activeC, inactiveC);

    type RowType = { img: string };
    const body: RowType[] = (list || []).map((a, idx) => ({ img: images[idx] }));

    const imageSizeMm = 12;

    autoTable(doc, {
      startY: 58,
      head: [['Athlete', 'Email', 'Exercise', 'Intensity', 'Time', 'Status', 'Reflection', 'Coach response', 'Photo']],
      body: body.map((_, idx) => [
        list[idx]?.name || 'Student',
        list[idx]?.student_email || '—',
        list[idx]?.routine || 'N/A',
        list[idx]?.routine_intensity || 'N/A',
        this.formatTime12h(list[idx]?.time_of_submission) || 'N/A',
        list[idx]?.status || 'active',
        this.clipPdfText(list[idx]?.student_reflection || '—', 280),
        this.clipPdfText(list[idx]?.coach_response || '—', 280),
        ''
      ]),
      styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak', minCellHeight: imageSizeMm + 3 },
      headStyles: { fillColor: [10, 118, 100] },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 34 },
        2: { cellWidth: 36 },
        3: { cellWidth: 22 },
        4: { cellWidth: 20 },
        5: { cellWidth: 18 },
        6: { cellWidth: 44 },
        7: { cellWidth: 44 },
        8: { cellWidth: imageSizeMm + 5 }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 8) {
          const rowIndex = data.row.index;
          const imgData = body[rowIndex]?.img;
          if (imgData) {
            const w = imageSizeMm;
            const h = imageSizeMm;
            const x = data.cell.x + (data.cell.width - w) / 2;
            const y = data.cell.y + (data.cell.height - h) / 2;
            try {
              (doc as any).addImage(imgData, 'PNG', x, y, w, h);
            } catch {
              /* ignore */
            }
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
                const rawStatus = (a.status ?? a.student_status ?? '').toString().toLowerCase().trim();
                const status: 'active' | 'inactive' = rawStatus === 'active' ? 'active' : 'inactive';
                return {
                  user_id: a.user_id ?? a.id ?? null,
                  name: a.name ?? a.username ?? 'Student',
                  student_email: a.student_email ?? a.email ?? null,
                  image,
                  routine: a.routine || '',
                  routine_intensity: a.routine_intensity || '',
                  time_of_submission: a.time_of_submission || '',
                  student_reflection: a.student_reflection ?? null,
                  coach_response: a.coach_response ?? null,
                  status
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

    type MonthRow = {
      date: string;
      name: string;
      email: string;
      routine: string;
      intensity: string;
      time: string;
      reflection: string;
      coach: string;
      status: string;
      imageUrl: string | null;
    };
    const rows: MonthRow[] = [];
    for (const d of days) {
      const list = this.monthlyAttendanceCache.get(d) || [];
      const dateStr = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      for (const a of list) {
        rows.push({
          date: dateStr,
          name: a.name || 'Student',
          email: a.student_email || '—',
          routine: a.routine || 'N/A',
          intensity: a.routine_intensity || 'N/A',
          time: this.formatTime12h(a.time_of_submission) || 'N/A',
          reflection: this.clipPdfText(a.student_reflection || '—', 260),
          coach: this.clipPdfText(a.coach_response || '—', 260),
          status: a.status || 'active',
          imageUrl: a.image || null
        });
      }
      if (list.length === 0) {
        rows.push({
          date: dateStr,
          name: '(none)',
          email: '—',
          routine: 'N/A',
          intensity: 'N/A',
          time: 'N/A',
          reflection: '—',
          coach: '—',
          status: '—',
          imageUrl: null
        });
      }
    }

    const images: string[] = await Promise.all(rows.map(async r => (r.imageUrl ? await this.toDataURL(r.imageUrl) : '')));

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageW = doc.internal.pageSize.getWidth();
    const ym = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}`;
    doc.setFillColor(10, 118, 100);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text('Athletrack — Routine history (full month)', 14, 13);
    doc.setFontSize(10);
    doc.text(`${this.selectedClass.class_name || 'Class'} · ${ym}`, 14, 19);
    doc.setTextColor(0, 0, 0);

    const submissionRows = rows.filter(r => r.name !== '(none)');
    doc.setFontSize(10);
    doc.text(
      `There are ${submissionRows.length} submission row${submissionRows.length === 1 ? '' : 's'} across ${ym}. Charts summarize active vs inactive attendance markers per logged row.`,
      14,
      30,
      { maxWidth: pageW - 28 }
    );
    const act = submissionRows.filter(r => r.status === 'active').length;
    const inact = submissionRows.filter(r => r.status === 'inactive').length;
    this.drawRoutineDayMixBarPdf(doc, 14, 42, act, inact);

    const imageSizeMm = 11;
    autoTable(doc, {
      startY: 56,
      head: [['Date', 'Athlete', 'Email', 'Exercise', 'Intensity', 'Time', 'Status', 'Reflection', 'Coach response', 'Photo']],
      body: rows.map(() => new Array(10).fill('')),
      styles: { fontSize: 6.5, cellPadding: 1.2, overflow: 'linebreak', minCellHeight: imageSizeMm + 3 },
      headStyles: { fillColor: [10, 118, 100], fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 26 },
        2: { cellWidth: 30 },
        3: { cellWidth: 34 },
        4: { cellWidth: 16 },
        5: { cellWidth: 16 },
        6: { cellWidth: 14 },
        7: { cellWidth: 38 },
        8: { cellWidth: 38 },
        9: { cellWidth: imageSizeMm + 4 }
      },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const idx = data.row.index;
          const r = rows[idx];
          const cells = [
            r.date,
            r.name,
            r.email,
            r.routine,
            r.intensity,
            r.time,
            r.status,
            r.reflection,
            r.coach,
            ''
          ];
          const col = data.column.index;
          if (col >= 0 && col < 9) {
            data.cell.text = [cells[col]];
          }
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 9) {
          const idx = data.row.index;
          const imgData = images[idx];
          if (imgData) {
            const w = imageSizeMm;
            const h = imageSizeMm;
            const x = data.cell.x + (data.cell.width - w) / 2;
            const y = data.cell.y + (data.cell.height - h) / 2;
            try {
              (doc as any).addImage(imgData, 'PNG', x, y, w, h);
            } catch {
              /* ignore */
            }
          }
        }
      }
    });

    const fileName = `routine_report_month_${(this.selectedClass.class_name || 'class').toString().replace(/\s+/g, '_')}_${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}.pdf`;
    doc.save(fileName);
  }

  private clipPdfText(value: string | null | undefined, maxChars: number): string {
    const t = (value ?? '').toString().replace(/\s+/g, ' ').trim();
    if (!t) {
      return '—';
    }
    if (t.length <= maxChars) {
      return t;
    }
    return `${t.slice(0, maxChars - 1)}…`;
  }

  private drawRoutineDayMixBarPdf(doc: jsPDF, x: number, y: number, active: number, inactive: number): void {
    const total = active + inactive || 1;
    const barW = 120;
    const barH = 7;
    let cx = x;
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text('Attendance mix (active vs inactive markers)', x, y - 1);
    const segments = [
      { n: active, rgb: [34, 197, 94] as [number, number, number], label: 'Active' },
      { n: inactive, rgb: [148, 163, 184] as [number, number, number], label: 'Inactive' }
    ];
    for (const seg of segments) {
      const w = (seg.n / total) * barW;
      doc.setFillColor(seg.rgb[0], seg.rgb[1], seg.rgb[2]);
      doc.rect(cx, y, Math.max(w, seg.n > 0 ? 1.5 : 0), barH, 'F');
      cx += Math.max(w, seg.n > 0 ? 1.5 : 0);
    }
    doc.setTextColor(40, 40, 40);
    doc.text(`Active: ${active}   Inactive: ${inactive}`, x, y + barH + 5);
  }

  private fetchRoutineHistory(): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    if (!this.currentAdminId) {
      this.errorMessage = 'Could not load admin ID. Please log in.';
      this.isLoading = false;
      return;
    }
    
    const url = `${environment.apiUrl}/routes.php?request=getClasses&admin_id=${this.currentAdminId}`;
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

