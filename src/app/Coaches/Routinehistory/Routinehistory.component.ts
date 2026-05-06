import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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
  image?: string | null;
  routine?: string;
  routine_intensity?: string;
  time_of_submission?: string;
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
            image,
            routine: a.routine || '',
            routine_intensity: a.routine_intensity || '',
            time_of_submission: a.time_of_submission || '',
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
    if (!this.selectedDay) {
      return;
    }
    const ds = `${this.selectedYear}-${this.pad2(this.selectedMonth)}-${this.pad2(this.selectedDay)}`;
    await this.exportRoutineHistoryPdf(ds, ds, `Daily · ${ds}`);
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
    if (!this.selectedClass?.class_id) {
      return;
    }
    const y = this.selectedYear;
    await this.exportRoutineHistoryPdf(`${y}-01-01`, `${y}-12-31`, `Year ${y}`);
  }

  /** Menu "Day report" — selected calendar day */
  async generateMonthlyReport() {
    if (!this.selectedClass?.class_id || !this.selectedDay) {
      return;
    }
    const ds = `${this.selectedYear}-${this.pad2(this.selectedMonth)}-${this.pad2(this.selectedDay)}`;
    await this.exportRoutineHistoryPdf(ds, ds, `Daily · ${ds}`);
  }

  async generateWholeMonthReport() {
    if (!this.selectedClass?.class_id) {
      return;
    }
    const y = this.selectedYear;
    const m = this.selectedMonth;
    const last = new Date(y, m, 0).getDate();
    await this.exportRoutineHistoryPdf(
      `${y}-${this.pad2(m)}-01`,
      `${y}-${this.pad2(m)}-${this.pad2(last)}`,
      `Month · ${y}-${this.pad2(m)}`
    );
  }

  async generateCustomRoutineReport() {
    const form = await Swal.fire({
      title: 'Custom routine report range',
      html:
        '<label class="block text-left text-sm mb-1">Start date</label>' +
        '<input id="rh-start" type="date" class="swal2-input" />' +
        '<label class="block text-left text-sm mb-1 mt-2">End date</label>' +
        '<input id="rh-end" type="date" class="swal2-input" />',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Generate PDF',
      confirmButtonColor: '#0A7664',
      preConfirm: () => {
        const a = (document.getElementById('rh-start') as HTMLInputElement)?.value;
        const b = (document.getElementById('rh-end') as HTMLInputElement)?.value;
        if (!a || !b) {
          Swal.showValidationMessage('Both dates are required');
          return null;
        }
        if (a > b) {
          Swal.showValidationMessage('Start must be on or before end');
          return null;
        }
        return { a, b };
      }
    });
    if (!form.isConfirmed || !form.value) {
      return;
    }
    await this.exportRoutineHistoryPdf(form.value.a, form.value.b, `Custom · ${form.value.a} to ${form.value.b}`);
  }

  private pad2(n: number): string {
    return String(n).padStart(2, '0');
  }

  private normalizeRhStudentStatus(s: any): string {
    return String(s?.student_status ?? '').toLowerCase().trim();
  }

  /**
   * Routine history PDF classification:
   * - Detailed rows: each submission in period (reflection + coach response).
   * - Compact list: roster members not deactivated with zero submissions in period.
   * - Deactivated list: codegen student_status deactivated with kickhistory fields when present.
   */
  private async exportRoutineHistoryPdf(periodStart: string, periodEnd: string, periodDescription: string) {
    if (!this.selectedClass?.class_id || !this.currentAdminId) {
      void Swal.fire({ icon: 'error', title: 'Unavailable', text: 'Class or coach session missing.' });
      return;
    }
    const cid = this.selectedClass.class_id;
    const url =
      `${environment.apiUrl}/routes.php?request=getRoutineHistoryReportData&class_id=${cid}&admin_id=${this.currentAdminId}` +
      `&period_start=${encodeURIComponent(periodStart)}&period_end=${encodeURIComponent(periodEnd)}`;

    let res: any;
    try {
      res = await firstValueFrom(this.http.get<any>(url));
    } catch {
      void Swal.fire({ icon: 'error', title: 'Error', text: 'Could not load routine report.' });
      return;
    }
    if (res?.status?.remarks !== 'success' || !res?.payload) {
      void Swal.fire({ icon: 'error', title: 'Unavailable', text: res?.status?.message || 'Report failed.' });
      return;
    }

    const p = res.payload;
    const students: any[] = Array.isArray(p.students) ? p.students : [];
    const submissions: any[] = Array.isArray(p.submissions) ? p.submissions : [];
    const daily: { date: string; count: number }[] = Array.isArray(p.daily_submissions) ? p.daily_submissions : [];

    const uidsInPeriod = new Set<number>();
    for (const row of submissions) {
      const uid = Number(row.user_id);
      if (uid > 0) {
        uidsInPeriod.add(uid);
      }
    }

    const deactivatedRows = students.filter((s) => this.normalizeRhStudentStatus(s) === 'deactivated');
    const rosterNonDeactivated = students.filter((s) => this.normalizeRhStudentStatus(s) !== 'deactivated');
    const noSubmissionPeriod = rosterNonDeactivated.filter((s) => Number(s.submissions_in_period ?? 0) === 0);

    const summaryStudentsWithSubmission = uidsInPeriod.size;
    const summaryNoSubmission = noSubmissionPeriod.length;
    const summaryTotalSubmissions = Number(p.total_submissions_in_period ?? submissions.length);
    const summaryDeactivated = deactivatedRows.length;
    const summaryTotalStudents = students.length;

    const doc = new jsPDF({ orientation: 'landscape' });
    const pageW = doc.internal.pageSize.getWidth();
    const generatedAt = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    doc.setFillColor(10, 118, 100);
    doc.rect(0, 0, pageW, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text('Routine History Report', 14, 13);
    doc.setFontSize(10);
    doc.text(`${p.class_name || this.selectedClass?.class_name || 'Class'} · ${periodDescription}`, 14, 19);
    doc.setTextColor(0, 0, 0);

    let y = 28;
    doc.setFontSize(9);
    doc.text(`Coach: ${p.coach_name || '—'}`, 14, y);
    y += 5;
    doc.text(`Routine / report period: ${periodStart} to ${periodEnd}`, 14, y);
    y += 5;
    doc.text(`Generated: ${generatedAt}`, 14, y);
    y += 10;

    this.drawRoutineReportPie(doc, 14, y, summaryStudentsWithSubmission, summaryNoSubmission, summaryDeactivated);
    this.drawRoutineReportLine(doc, 125, y, daily);
    y += 40;

    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Count']],
      body: [
        ['Total students in class', String(summaryTotalStudents)],
        ['Students with ≥1 submission in selected period', String(summaryStudentsWithSubmission)],
        ['Students with no submission in selected period', String(summaryNoSubmission)],
        ['Total routine submissions in selected period', String(summaryTotalSubmissions)],
        ['Deactivated students (on roster)', String(summaryDeactivated)]
      ],
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [34, 71, 63] },
      theme: 'striped',
      margin: { left: 14, right: 14 },
      tableWidth: pageW - 28
    });
    y = ((doc as any).lastAutoTable?.finalY ?? y + 40) + 8;

    const histAll = this.intensityHistogramRecords(
      submissions.map((r: any) => ({ routine_intensity: r.routine_intensity }))
    );
    doc.setFontSize(9);
    doc.setTextColor(34, 71, 63);
    doc.text('Intensity mix — submissions in period', 14, y);
    this.drawIntensityDistribution(doc, 14, y + 3, histAll);
    y += 42;

    doc.setFillColor(22, 101, 52);
    doc.rect(14, y - 4, pageW - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('1. Submitted Routine History', 18, y + 2);
    doc.setTextColor(0, 0, 0);
    y += 12;

    const byUser = new Map<number, any[]>();
    for (const row of submissions) {
      const uid = Number(row.user_id);
      if (!byUser.has(uid)) {
        byUser.set(uid, []);
      }
      byUser.get(uid)!.push(row);
    }
    const sortedUids = Array.from(byUser.keys()).sort((a, b) => {
      const na = (byUser.get(a)![0].student_name || '').toString();
      const nb = (byUser.get(b)![0].student_name || '').toString();
      return na.localeCompare(nb);
    });

    if (!sortedUids.length) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text('No submissions in this period.', 14, y);
      y += 10;
    }

    for (const uid of sortedUids) {
      const rows = byUser.get(uid)!;
      const name = rows[0]?.student_name ?? 'Student';
      const code = rows[0]?.student_code ?? '—';
      doc.setFontSize(10);
      doc.setTextColor(2, 47, 17);
      doc.text(`Student: ${name}   Code: ${code}`, 14, y);
      y += 5;
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(`Status: Active during selected period    Total submissions: ${rows.length}`, 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [['Routine', 'Date', 'Time', 'Intensity', 'Reflection', 'Coach response', 'Status', 'Proof']],
        body: rows.map((r: any) => [
          (r.routine ?? '—').toString(),
          (r.date_of_submission ?? '—').toString(),
          this.formatTime12h(r.time_of_submission),
          (r.routine_intensity ?? '—').toString(),
          (r.student_reflection ?? '').toString() || '—',
          (r.coach_response ?? '').toString() || '—',
          'Submitted',
          r.img ? 'Yes' : 'No'
        ]),
        styles: { fontSize: 7, cellPadding: 1.5, overflow: 'linebreak' },
        headStyles: { fillColor: [10, 118, 100] },
        theme: 'striped',
        margin: { left: 14, right: 14 }
      });
      y = ((doc as any).lastAutoTable?.finalY ?? y + 30) + 10;
    }

    doc.setFillColor(107, 114, 128);
    doc.rect(14, y - 4, pageW - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('2. Students With No Submission During This Report Period', 18, y + 2);
    doc.setTextColor(0, 0, 0);
    y += 12;

    autoTable(doc, {
      startY: y,
      head: [['Student', 'Code / ID', 'Last submission (if any)', 'Note']],
      body:
        noSubmissionPeriod.length > 0
          ? noSubmissionPeriod.map((s: any) => [
              s.name ?? '—',
              s.code ?? '—',
              Number(s.submissions_all_time ?? 0) > 0 ? (s.last_submission_date ?? '—') : 'No submission history',
              Number(s.submissions_all_time ?? 0) > 0 ? 'Quiet this period' : 'Never submitted'
            ])
          : [['No students found in this category.', '—', '—', '—']],
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [107, 114, 128] },
      theme: 'striped',
      margin: { left: 14, right: 14 }
    });
    y = ((doc as any).lastAutoTable?.finalY ?? y + 24) + 10;

    doc.setFillColor(185, 28, 28);
    doc.rect(14, y - 4, pageW - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('3. Deactivated Students', 18, y + 2);
    doc.setTextColor(0, 0, 0);
    y += 12;

    autoTable(doc, {
      startY: y,
      head: [['Student', 'Reason', 'Date deactivated', 'Last submitted routine', 'Last submission']],
      body:
        deactivatedRows.length > 0
          ? deactivatedRows.map((s: any) => [
              s.name ?? '—',
              (s.deactivation_reason ?? '—').toString(),
              this.formatRhDeactivatedAt(s.deactivated_at),
              (s.last_routine_before_deactivation ?? '—').toString(),
              (s.last_submission_before_deactivation ?? '—').toString()
            ])
          : [['No deactivated students on this roster.', '—', '—', '—', '—']],
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [185, 28, 28] },
      theme: 'striped',
      margin: { left: 14, right: 14 }
    });

    const safe = (p.class_name || this.selectedClass?.class_name || 'class').toString().replace(/\s+/g, '_');
    doc.save(`${safe}_routine_history_${periodStart}_${periodEnd}.pdf`);
  }

  private formatRhDeactivatedAt(raw: any): string {
    if (raw == null || raw === '') {
      return '—';
    }
    const d = new Date(String(raw).replace(' ', 'T'));
    return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  }

  private drawRoutineReportPie(doc: jsPDF, x: number, y: number, withSub: number, noSub: number, deact: number) {
    const slices = [
      { v: withSub, rgb: [34, 197, 94] as [number, number, number], label: 'Had submission(s) in period' },
      { v: noSub, rgb: [156, 163, 175] as [number, number, number], label: 'No submission in period' },
      { v: deact, rgb: [239, 68, 68] as [number, number, number], label: 'Deactivated' }
    ];
    const total = slices.reduce((s, z) => s + z.v, 0) || 1;
    const r = 14;
    const cx = x + r + 4;
    const cy = y + r + 6;
    let ang = -Math.PI / 2;
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text('Roster focus (pie)', x, y);
    for (const sl of slices) {
      const arc = (sl.v / total) * Math.PI * 2;
      if (sl.v <= 0) {
        continue;
      }
      doc.setFillColor(sl.rgb[0], sl.rgb[1], sl.rgb[2]);
      const steps = Math.max(8, Math.ceil((sl.v / total) * 40));
      for (let i = 0; i < steps; i++) {
        const t1 = ang + (i / steps) * arc;
        const t2 = ang + ((i + 1) / steps) * arc;
        const p1x = cx + r * Math.cos(t1);
        const p1y = cy + r * Math.sin(t1);
        const p2x = cx + r * Math.cos(t2);
        const p2y = cy + r * Math.sin(t2);
        doc.lines(
          [
            [p1x - cx, p1y - cy],
            [p2x - p1x, p2y - p1y],
            [cx - p2x, cy - p2y]
          ],
          cx,
          cy,
          [1, 1],
          'F',
          true
        );
      }
      ang += arc;
    }
    doc.setFillColor(255, 255, 255);
    doc.circle(cx, cy, r * 0.48, 'F');
    let ly = y + 6;
    for (const sl of slices) {
      doc.setFillColor(sl.rgb[0], sl.rgb[1], sl.rgb[2]);
      doc.rect(x + r * 2 + 18, ly - 2, 3, 3, 'F');
      doc.setTextColor(40, 40, 40);
      doc.text(`${sl.label}: ${sl.v}`, x + r * 2 + 24, ly);
      ly += 5;
    }
  }

  private drawRoutineReportLine(doc: jsPDF, x: number, y: number, daily: { date: string; count: number }[]) {
    const plotW = 115;
    const plotH = 28;
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text('Submissions over time (line)', x, y);
    doc.setDrawColor(180, 180, 180);
    doc.rect(x, y + 4, plotW, plotH, 'S');
    if (!daily.length) {
      doc.text('No submissions in this period.', x + 4, y + 18);
      return;
    }
    const maxC = Math.max(...daily.map((d) => d.count), 1);
    const xs = daily.map((_, i) => x + (i / Math.max(daily.length - 1, 1)) * plotW);
    const ys = daily.map((d) => y + 4 + plotH - (d.count / maxC) * (plotH - 4));
    doc.setDrawColor(10, 118, 100);
    doc.setLineWidth(0.4);
    for (let i = 0; i < daily.length - 1; i++) {
      doc.line(xs[i], ys[i], xs[i + 1], ys[i + 1]);
    }
    doc.setFillColor(10, 118, 100);
    for (let i = 0; i < daily.length; i++) {
      doc.circle(xs[i], ys[i], 0.8, 'F');
    }
  }

  private intensityHistogramRecords(records: Pick<AttendeeRecord, 'routine_intensity'>[]): Map<string, number> {
    const m = new Map<string, number>();
    for (const k of ['Easy', 'Average', 'Hard', 'Other']) {
      m.set(k, 0);
    }
    for (const r of records) {
      const raw = (r.routine_intensity || '').toLowerCase();
      let key = 'Other';
      if (raw.includes('easy')) {
        key = 'Easy';
      } else if (raw.includes('average') || raw.includes('medium')) {
        key = 'Average';
      } else if (raw.includes('hard')) {
        key = 'Hard';
      }
      m.set(key, (m.get(key) || 0) + 1);
    }
    return m;
  }

  private drawIntensityDistribution(doc: jsPDF, x: number, y: number, hist: Map<string, number>): void {
    const order = ['Easy', 'Average', 'Hard', 'Other'];
    const colors: Record<string, [number, number, number]> = {
      Easy: [34, 197, 94],
      Average: [234, 179, 8],
      Hard: [220, 38, 38],
      Other: [148, 163, 184]
    };
    let yy = y;
    const max = Math.max(...order.map(k => hist.get(k) || 0), 1);
    const maxBar = 50;
    for (const k of order) {
      const n = hist.get(k) || 0;
      const w = (n / max) * maxBar;
      doc.setFillColor(colors[k][0], colors[k][1], colors[k][2]);
      doc.rect(x + 44, yy - 3, Math.max(w, n > 0 ? 2 : 0), 4, 'F');
      doc.setFontSize(7);
      doc.setTextColor(40, 40, 40);
      doc.text(`${k}: ${n}`, x, yy);
      yy += 7;
    }
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

