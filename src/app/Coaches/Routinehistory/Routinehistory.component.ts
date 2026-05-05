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
  image?: string | null;
  routine?: string;
  routine_intensity?: string;
  time_of_submission?: string;
  status?: 'active' | 'inactive';
}

/** Shape used only when assembling yearly PDF rows (report generation). */
interface YearRoutinePdfRow {
  date: string;
  name: string;
  routine: string;
  intensity: string;
  time: string;
  imageUrl: string | null;
  rosterMark: 'active' | 'inactive';
  userId: number | null;
  kind: 'submission' | 'placeholder';
}

interface MonthRoutinePdfRow {
  date: string;
  name: string;
  routine: string;
  intensity: string;
  time: string;
  status: string;
  imageUrl: string | null;
  userId: number | null;
  kind: 'submission' | 'placeholder';
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
    const rows: YearRoutinePdfRow[] = [];
    const monthSubmissionTotals = Array.from({ length: 12 }, () => 0);

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
                  image,
                  routine: a.routine || '',
                  routine_intensity: a.routine_intensity || '',
                  time_of_submission: a.time_of_submission || '',
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
            routine: 'N/A',
            intensity: 'N/A',
            time: 'N/A',
            imageUrl: null,
            rosterMark: 'inactive',
            userId: null,
            kind: 'placeholder'
          });
        } else {
          monthSubmissionTotals[month - 1] += list.length;
          for (const a of list) {
            const mark = (a.status || 'active') === 'active' ? 'active' : 'inactive';
            rows.push({
              date: dateStr,
              name: a.name || 'Student',
              routine: a.routine || 'N/A',
              intensity: a.routine_intensity || 'N/A',
              time: a.time_of_submission || 'N/A',
              imageUrl: a.image || null,
              rosterMark: mark,
              userId: a.user_id ?? null,
              kind: 'submission'
            });
          }
        }
      }
    }

    const submissions = rows.filter(r => r.kind === 'submission');
    const placeholders = rows.filter(r => r.kind === 'placeholder');
    const subActive = submissions.filter(r => r.rosterMark === 'active');
    const subInactive = submissions.filter(r => r.rosterMark === 'inactive');

    const uniqActive = this.uniqueUserIdCount(subActive.map(r => r.userId));
    const uniqInactive = this.uniqueUserIdCount(subInactive.map(r => r.userId));
    const histActive = this.intensityHistogramRecords(
      subActive.map(r => ({ routine_intensity: r.intensity }) as AttendeeRecord)
    );
    const histInactive = this.intensityHistogramRecords(
      subInactive.map(r => ({ routine_intensity: r.intensity }) as AttendeeRecord)
    );

    const imagesSubActive = await Promise.all(subActive.map(async r => (r.imageUrl ? await this.toDataURL(r.imageUrl) : '')));
    const imagesSubInactive = await Promise.all(subInactive.map(async r => (r.imageUrl ? await this.toDataURL(r.imageUrl) : '')));

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

    doc.setFontSize(10);
    doc.text(
      `Demographics: ${submissions.length} submission rows across ${year}; ${placeholders.length} calendar day slots with no uploads. Unique athletes with submissions — roster-active: ${uniqActive}, roster-inactive marker: ${uniqInactive}.`,
      14,
      30,
      { maxWidth: pageW - 28 }
    );

    this.drawRoutineDayMixBarPdf(doc, 14, 42, submissions.length, placeholders.length, {
      title: 'Volume: submissions vs empty-day placeholders',
      leftLabel: 'Submissions',
      rightLabel: 'Empty days'
    });
    this.drawRoutineDayMixBarPdf(doc, 150, 42, subActive.length, subInactive.length, {
      title: 'Among submissions — roster status marker',
      leftLabel: 'Active-marked',
      rightLabel: 'Inactive-marked'
    });

    autoTable(doc, {
      startY: 58,
      head: [['Metric', 'Count']],
      body: [
        ['Submission rows', String(submissions.length)],
        ['Placeholder days', String(placeholders.length)],
        ['Submissions — active-marked rows', String(subActive.length)],
        ['Submissions — inactive-marked rows', String(subInactive.length)],
        ['Unique athletes (active-marked submissions)', String(uniqActive)],
        ['Unique athletes (inactive-marked submissions)', String(uniqInactive)]
      ],
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [34, 71, 63] },
      theme: 'striped',
      margin: { left: 14, right: 14 },
      tableWidth: 115
    });

    let chartY = ((doc as any).lastAutoTable?.finalY ?? 72) + 8;
    doc.setFontSize(9);
    doc.setTextColor(34, 71, 63);
    doc.text('Monthly submission volume', 130, chartY);
    this.drawMonthlyVolumeBars(doc, 130, chartY + 4, monthSubmissionTotals);

    chartY += 36;
    doc.setTextColor(34, 71, 63);
    doc.text('Intensity — active-marked submissions', 14, chartY);
    this.drawIntensityDistribution(doc, 14, chartY + 3, histActive);
    doc.text('Intensity — inactive-marked submissions', 130, chartY);
    this.drawIntensityDistribution(doc, 130, chartY + 3, histInactive);

    chartY += 42;
    chartY = this.appendYearSubmissionPhotoTable(doc, 'Active-marked submissions', subActive, imagesSubActive, chartY, pageW, [22, 101, 52]);
    this.appendYearSubmissionPhotoTable(doc, 'Inactive-marked submissions', subInactive, imagesSubInactive, chartY, pageW, [107, 114, 128]);

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
    const full = this.monthlyAttendanceCache.get(day) || [];
    const activeAttendees = full.filter(a => (a.status || 'active') === 'active');
    const inactiveAttendees = full.filter(a => (a.status || 'active') === 'inactive');

    const imagesActive = await Promise.all(activeAttendees.map(async a => (a.image ? await this.toDataURL(a.image) : '')));
    const imagesInactive = await Promise.all(inactiveAttendees.map(async a => (a.image ? await this.toDataURL(a.image) : '')));

    const uniqActive = this.uniqueUserIdCount(activeAttendees.map(a => a.user_id));
    const uniqInactive = this.uniqueUserIdCount(inactiveAttendees.map(a => a.user_id));
    const histActive = this.intensityHistogramRecords(activeAttendees);
    const histInactive = this.intensityHistogramRecords(inactiveAttendees);

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

    const scope =
      filter === 'all' ? 'full roster export' : filter === 'active' ? 'active-only sections' : 'inactive-only sections';

    doc.setFontSize(10);
    doc.text(
      `Demographics (${scope}): ${full.length} roster rows — ${activeAttendees.length} active-marked (submitted), ${inactiveAttendees.length} inactive-marked (no submission). Unique athletes: ${uniqActive} active cohort vs ${uniqInactive} inactive cohort.`,
      14,
      30,
      { maxWidth: pageW - 28 }
    );

    this.drawRoutineDayMixBarPdf(doc, 14, 42, activeAttendees.length, inactiveAttendees.length, {
      title: 'Row counts — active vs inactive roster markers',
      leftLabel: 'Active',
      rightLabel: 'Inactive'
    });
    this.drawRoutineDayMixBarPdf(doc, 158, 42, uniqActive, uniqInactive, {
      title: 'Unique athletes — active vs inactive',
      leftLabel: 'Unique active',
      rightLabel: 'Unique inactive'
    });

    autoTable(doc, {
      startY: 58,
      head: [['Metric', 'Value']],
      body: [
        ['Calendar date', dateLabel],
        ['Total roster rows', String(full.length)],
        ['Active-marked rows', String(activeAttendees.length)],
        ['Inactive-marked rows', String(inactiveAttendees.length)],
        ['Unique athletes (active)', String(uniqActive)],
        ['Unique athletes (inactive)', String(uniqInactive)]
      ],
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [10, 118, 100] },
      theme: 'striped',
      margin: { left: 14, right: 14 },
      tableWidth: 118
    });

    let chartY = ((doc as any).lastAutoTable?.finalY ?? 74) + 10;
    doc.setFontSize(9);
    doc.setTextColor(34, 71, 63);
    doc.text('Training intensity — active cohort', 14, chartY);
    this.drawIntensityDistribution(doc, 14, chartY + 3, histActive);
    doc.text('Training intensity — inactive cohort', 130, chartY);
    this.drawIntensityDistribution(doc, 130, chartY + 3, histInactive);

    chartY += 42;

    const showActive = filter !== 'inactive';
    const showInactive = filter !== 'active';

    if (showActive) {
      chartY = this.appendDayRosterPhotoTable(
        doc,
        'Active roster — submitted today',
        activeAttendees,
        imagesActive,
        chartY,
        pageW,
        [22, 101, 52]
      );
    }
    if (showInactive) {
      this.appendDayRosterPhotoTable(
        doc,
        'Inactive roster — missing submission',
        inactiveAttendees,
        imagesInactive,
        chartY,
        pageW,
        [107, 114, 128]
      );
    }

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
                  image,
                  routine: a.routine || '',
                  routine_intensity: a.routine_intensity || '',
                  time_of_submission: a.time_of_submission || '',
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

    const rows: MonthRoutinePdfRow[] = [];
    for (const d of days) {
      const list = this.monthlyAttendanceCache.get(d) || [];
      const dateStr = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      for (const a of list) {
        rows.push({
          date: dateStr,
          name: a.name || 'Student',
          routine: a.routine || 'N/A',
          intensity: a.routine_intensity || 'N/A',
          time: this.formatTime12h(a.time_of_submission) || 'N/A',
          status: (a.status || 'active') as string,
          imageUrl: a.image || null,
          userId: a.user_id ?? null,
          kind: 'submission'
        });
      }
      if (list.length === 0) {
        rows.push({
          date: dateStr,
          name: '(none)',
          routine: 'N/A',
          intensity: 'N/A',
          time: 'N/A',
          status: '—',
          imageUrl: null,
          userId: null,
          kind: 'placeholder'
        });
      }
    }

    const submissions = rows.filter(r => r.kind === 'submission');
    const placeholders = rows.filter(r => r.kind === 'placeholder');
    const activeSlice = submissions.filter(r => r.status === 'active');
    const inactiveSlice = submissions.filter(r => r.status === 'inactive');

    const imagesActive = await Promise.all(activeSlice.map(async r => (r.imageUrl ? await this.toDataURL(r.imageUrl) : '')));
    const imagesInactive = await Promise.all(inactiveSlice.map(async r => (r.imageUrl ? await this.toDataURL(r.imageUrl) : '')));

    const uniqA = this.uniqueUserIdCount(activeSlice.map(r => r.userId));
    const uniqI = this.uniqueUserIdCount(inactiveSlice.map(r => r.userId));
    const histA = this.intensityHistogramRecords(activeSlice.map(r => ({ routine_intensity: r.intensity })));
    const histI = this.intensityHistogramRecords(inactiveSlice.map(r => ({ routine_intensity: r.intensity })));

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

    doc.setFontSize(10);
    doc.text(
      `Demographics: ${submissions.length} submission rows; ${placeholders.length} empty calendar placeholders; active-marked rows ${activeSlice.length}; inactive-marked rows ${inactiveSlice.length}; unique athletes ${uniqA} (active) / ${uniqI} (inactive).`,
      14,
      30,
      { maxWidth: pageW - 28 }
    );

    this.drawRoutineDayMixBarPdf(doc, 14, 42, submissions.length, placeholders.length, {
      title: 'Volume — uploads vs empty-day placeholders',
      leftLabel: 'Submission rows',
      rightLabel: 'Empty days'
    });
    this.drawRoutineDayMixBarPdf(doc, 158, 42, activeSlice.length, inactiveSlice.length, {
      title: 'Among uploads — roster markers',
      leftLabel: 'Active-marked',
      rightLabel: 'Inactive-marked'
    });

    autoTable(doc, {
      startY: 58,
      head: [['Metric', 'Count']],
      body: [
        ['Submission rows', String(submissions.length)],
        ['Placeholder days', String(placeholders.length)],
        ['Active-marked submissions', String(activeSlice.length)],
        ['Inactive-marked submissions', String(inactiveSlice.length)],
        ['Unique athletes (active cohort)', String(uniqA)],
        ['Unique athletes (inactive cohort)', String(uniqI)]
      ],
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [34, 71, 63] },
      theme: 'striped',
      margin: { left: 14, right: 14 },
      tableWidth: 118
    });

    let chartY = ((doc as any).lastAutoTable?.finalY ?? 74) + 10;
    doc.setFontSize(9);
    doc.setTextColor(34, 71, 63);
    doc.text('Intensity — active-marked uploads', 14, chartY);
    this.drawIntensityDistribution(doc, 14, chartY + 3, histA);
    doc.text('Intensity — inactive-marked uploads', 130, chartY);
    this.drawIntensityDistribution(doc, 130, chartY + 3, histI);

    chartY += 42;
    this.appendMonthSplitPhotoTables(
      doc,
      'Active-marked submissions — detail',
      activeSlice,
      imagesActive,
      'Inactive-marked submissions — detail',
      inactiveSlice,
      imagesInactive,
      chartY,
      pageW
    );

    const fileName = `routine_report_month_${(this.selectedClass.class_name || 'class').toString().replace(/\s+/g, '_')}_${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}.pdf`;
    doc.save(fileName);
  }

  private uniqueUserIdCount(ids: (number | null | undefined)[]): number {
    const s = new Set<number>();
    for (const id of ids) {
      const n = Number(id);
      if (n > 0) {
        s.add(n);
      }
    }
    return s.size;
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

  private drawMonthlyVolumeBars(doc: jsPDF, x: number, y: number, totals: number[]): void {
    const max = Math.max(...totals, 1);
    const labels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const barW = 7;
    const gap = 2;
    for (let i = 0; i < 12; i++) {
      const h = (totals[i] / max) * 22;
      doc.setFillColor(10, 118, 100);
      doc.rect(x + i * (barW + gap), y + (22 - h), barW, Math.max(h, 0.5), 'F');
      doc.setFontSize(6);
      doc.setTextColor(60, 60, 60);
      doc.text(String(totals[i]), x + i * (barW + gap) + 1, y + (22 - h) - 1);
      doc.text(labels[i], x + i * (barW + gap) + 1, y + 24);
    }
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

  private appendYearSubmissionPhotoTable(
    doc: jsPDF,
    sectionTitle: string,
    slice: YearRoutinePdfRow[],
    images: string[],
    startY: number,
    pageW: number,
    bannerRgb: [number, number, number]
  ): number {
    const imageSizeMm = 11;
    if (!slice.length) {
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`${sectionTitle}: no rows.`, 14, startY + 4);
      return startY + 12;
    }
    doc.setFillColor(bannerRgb[0], bannerRgb[1], bannerRgb[2]);
    doc.rect(14, startY, pageW - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`${sectionTitle} (${slice.length})`, 18, startY + 6);
    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: startY + 12,
      head: [['Date', 'Athlete', 'Exercise', 'Intensity', 'Time', 'Photo']],
      body: slice.map(() => ['', '', '', '', '', '']),
      styles: { fontSize: 7.5, cellPadding: 1.5, minCellHeight: imageSizeMm + 3 },
      headStyles: { fillColor: [bannerRgb[0], bannerRgb[1], bannerRgb[2]] },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 38 },
        2: { cellWidth: 52 },
        3: { cellWidth: 22 },
        4: { cellWidth: 22 },
        5: { cellWidth: imageSizeMm + 6 }
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const idx = data.row.index;
          const r = slice[idx];
          const cols = [r.date, r.name, r.routine, r.intensity, this.formatTime12h(r.time) || r.time, ''];
          const ci = data.column.index;
          if (ci >= 0 && ci < 5) {
            data.cell.text = [cols[ci]];
          }
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const idx = data.row.index;
          const imgData = images[idx];
          if (imgData) {
            const w = imageSizeMm;
            const h = imageSizeMm;
            const cx = data.cell.x + (data.cell.width - w) / 2;
            const cy = data.cell.y + (data.cell.height - h) / 2;
            try {
              (doc as any).addImage(imgData, 'PNG', cx, cy, w, h);
            } catch {
              /* ignore */
            }
          }
        }
      }
    });
    const fy = (doc as any).lastAutoTable?.finalY;
    return (typeof fy === 'number' ? fy : startY + 40) + 14;
  }

  private appendDayRosterPhotoTable(
    doc: jsPDF,
    sectionTitle: string,
    attendees: AttendeeRecord[],
    images: string[],
    startY: number,
    pageW: number,
    bannerRgb: [number, number, number]
  ): number {
    const imageSizeMm = 12;
    if (!attendees.length) {
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`${sectionTitle}: none`, 14, startY + 4);
      return startY + 12;
    }
    doc.setFillColor(bannerRgb[0], bannerRgb[1], bannerRgb[2]);
    doc.rect(14, startY, pageW - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`${sectionTitle} (${attendees.length})`, 18, startY + 6);
    doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: startY + 12,
      head: [['Athlete', 'Exercise', 'Intensity', 'Time', 'Photo']],
      body: attendees.map(() => ['', '', '', '', '']),
      styles: { fontSize: 8.5, cellPadding: 2, minCellHeight: imageSizeMm + 4 },
      headStyles: { fillColor: [bannerRgb[0], bannerRgb[1], bannerRgb[2]] },
      columnStyles: {
        0: { cellWidth: 54 },
        1: { cellWidth: 64 },
        2: { cellWidth: 30 },
        3: { cellWidth: 28 },
        4: { cellWidth: imageSizeMm + 6 }
      },
      margin: { left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const idx = data.row.index;
          const a = attendees[idx];
          const cols = [
            a.name || 'Student',
            a.routine || 'N/A',
            a.routine_intensity || 'N/A',
            this.formatTime12h(a.time_of_submission) || 'N/A',
            ''
          ];
          const ci = data.column.index;
          if (ci >= 0 && ci < 4) {
            data.cell.text = [cols[ci]];
          }
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const idx = data.row.index;
          const imgData = images[idx];
          if (imgData) {
            const w = imageSizeMm;
            const h = imageSizeMm;
            const cx = data.cell.x + (data.cell.width - w) / 2;
            const cy = data.cell.y + (data.cell.height - h) / 2;
            try {
              (doc as any).addImage(imgData, 'PNG', cx, cy, w, h);
            } catch {
              /* ignore */
            }
          }
        }
      }
    });
    const fy = (doc as any).lastAutoTable?.finalY;
    return (typeof fy === 'number' ? fy : startY + 40) + 12;
  }

  private appendMonthSplitPhotoTables(
    doc: jsPDF,
    titleActive: string,
    activeSlice: MonthRoutinePdfRow[],
    imagesActive: string[],
    titleInactive: string,
    inactiveSlice: MonthRoutinePdfRow[],
    imagesInactive: string[],
    startY: number,
    pageW: number
  ): void {
    const imageSizeMm = 10;
    const drawSlice = (
      title: string,
      slice: MonthRoutinePdfRow[],
      imgs: string[],
      y: number,
      rgb: [number, number, number]
    ): number => {
      if (!slice.length) {
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`${title}: none`, 14, y + 4);
        return y + 12;
      }
      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
      doc.rect(14, y, pageW - 28, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text(`${title} (${slice.length})`, 18, y + 6);
      doc.setTextColor(0, 0, 0);
      autoTable(doc, {
        startY: y + 12,
        head: [['Date', 'Athlete', 'Exercise', 'Intensity', 'Time', 'Photo']],
        body: slice.map(() => ['', '', '', '', '', '']),
        styles: { fontSize: 7, cellPadding: 1.4, minCellHeight: imageSizeMm + 3 },
        headStyles: { fillColor: [rgb[0], rgb[1], rgb[2]], fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 34 },
          2: { cellWidth: 46 },
          3: { cellWidth: 18 },
          4: { cellWidth: 18 },
          5: { cellWidth: imageSizeMm + 5 }
        },
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const idx = data.row.index;
            const r = slice[idx];
            const cols = [
              r.date,
              r.name,
              r.routine,
              r.intensity,
              r.time,
              ''
            ];
            const ci = data.column.index;
            if (ci >= 0 && ci < 5) {
              data.cell.text = [cols[ci]];
            }
          }
        },
        didDrawCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            const idx = data.row.index;
            const imgData = imgs[idx];
            if (imgData) {
              const w = imageSizeMm;
              const h = imageSizeMm;
              const cx = data.cell.x + (data.cell.width - w) / 2;
              const cy = data.cell.y + (data.cell.height - h) / 2;
              try {
                (doc as any).addImage(imgData, 'PNG', cx, cy, w, h);
              } catch {
                /* ignore */
              }
            }
          }
        }
      });
      const fy = (doc as any).lastAutoTable?.finalY;
      return (typeof fy === 'number' ? fy : y + 40) + 12;
    };

    let y = drawSlice(titleActive, activeSlice, imagesActive, startY, [22, 101, 52]);
    drawSlice(titleInactive, inactiveSlice, imagesInactive, y, [107, 114, 128]);
  }

  private drawRoutineDayMixBarPdf(
    doc: jsPDF,
    x: number,
    y: number,
    first: number,
    second: number,
    labels?: { title: string; leftLabel: string; rightLabel: string }
  ): void {
    const total = first + second || 1;
    const barW = 120;
    const barH = 7;
    let cx = x;
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(labels?.title ?? 'Attendance mix (active vs inactive markers)', x, y - 1);
    const leftLabel = labels?.leftLabel ?? 'Active';
    const rightLabel = labels?.rightLabel ?? 'Inactive';
    const segments: { n: number; rgb: [number, number, number] }[] = [
      { n: first, rgb: [34, 197, 94] },
      { n: second, rgb: [148, 163, 184] }
    ];
    for (const seg of segments) {
      const w = (seg.n / total) * barW;
      doc.setFillColor(seg.rgb[0], seg.rgb[1], seg.rgb[2]);
      doc.rect(cx, y, Math.max(w, seg.n > 0 ? 1.5 : 0), barH, 'F');
      cx += Math.max(w, seg.n > 0 ? 1.5 : 0);
    }
    doc.setTextColor(40, 40, 40);
    doc.text(`${leftLabel}: ${first}   ${rightLabel}: ${second}`, x, y + barH + 5);
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

