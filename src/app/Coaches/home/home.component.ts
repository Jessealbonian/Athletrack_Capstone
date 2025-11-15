import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { Chart, registerables } from 'chart.js';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthService } from '../../auth.service';
import { environment } from '../../../environments/environment';
import { Event } from '../services/event.service';

Chart.register(...registerables);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, SidenavComponent, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  isNavOpen = true;
  showUpcomingEventsModal = false;
  filteredEvents: Event[] = [];

  // Dashboard stats properties
  totalStudents: number = 0;
  totalClasses: number = 0;
  dailyActivityData: any[] = [];
  classCompletionStats: any[] = [];
  private lineChart: Chart | null = null;
  private pieCharts: Map<number, Chart> = new Map();
  currentAdminId: number | null = null;
  activeStudentsToday: number = 0;

  // Report generation properties
  showReportModal = false;
  reportType: 'week' | 'month' = 'week';
  selectedReportWeek: string = '';
  selectedReportMonth: string = '';
  selectedReportYear: string = '';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  ngAfterViewInit() {
    this.auth.getCurrentUser().subscribe(user => {
      if (user) {
        this.currentAdminId = user.id;
        this.loadDashboardData();
      } else {
        console.log("User not found");
      }
    });
  }

  loadDashboardData() {
    if (!this.currentAdminId) return;
    
    const adminIdParam = `&admin_id=${this.currentAdminId}`;
    
    // Load total students
    this.http.get(`${environment.apiUrl}/routes.php?request=getTotalStudents${adminIdParam}`).subscribe({
      next: (response: any) => {
        if (response.status?.remarks === 'success' && response.payload) {
          this.totalStudents = response.payload.total_students || 0;
        }
      },
      error: (error) => console.error('Error fetching total students:', error)
    });

    // Load total classes
    this.http.get(`${environment.apiUrl}/routes.php?request=getClasses${adminIdParam}`).subscribe({
      next: (response: any) => {
        if (response.status === 'success' && response.data) {
          this.totalClasses = response.data.length || 0;
        }
      },
      error: (error) => console.error('Error fetching classes:', error)
    });

    // Load daily activity
    this.http.get(`${environment.apiUrl}/routes.php?request=getDailyStudentActivity${adminIdParam}&days=7`).subscribe({
      next: (response: any) => {
        if (response.status?.remarks === 'success' && response.payload) {
          this.dailyActivityData = response.payload;
          const todayIso = new Date().toISOString().slice(0,10);
          const todayItem = this.dailyActivityData.find((d: any) => (new Date(d.date)).toISOString().slice(0,10) === todayIso)
                           || this.dailyActivityData[this.dailyActivityData.length - 1];
          this.activeStudentsToday = todayItem ? (todayItem.active_students || 0) : 0;
          this.createLineChart();
        }
      },
      error: (error) => console.error('Error fetching daily activity:', error)
    });

    // Load completion stats
    this.http.get(`${environment.apiUrl}/routes.php?request=getClassRoutineCompletionStats${adminIdParam}`).subscribe({
      next: (response: any) => {
        if (response.status?.remarks === 'success' && response.payload) {
          this.classCompletionStats = response.payload;
          setTimeout(() => this.createPieCharts(), 100);
        }
      },
      error: (error) => console.error('Error fetching completion stats:', error)
    });
  }

  private createLineChart() {
    const ctx = document.getElementById('lineChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    if (this.lineChart) {
      this.lineChart.destroy();
    }

    const context = ctx.getContext('2d');
    if (context) {
      const labels = this.dailyActivityData.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
      const data = this.dailyActivityData.map(item => item.active_students);

      this.lineChart = new Chart(context, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Active Students',
            data: data,
            borderColor: '#15957F',
            backgroundColor: 'rgba(21, 149, 127, 0.2)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
            },
            title: {
              display: true,
              text: 'Student Activity Over the Last 7 Days'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    } else {
      console.error('Failed to get canvas context');
    }
  }

  private createPieCharts() {
    this.pieCharts.forEach((chart, classId) => {
      chart.destroy();
    });
    this.pieCharts.clear();

    this.classCompletionStats.forEach((stat, index) => {
      const canvasId = `pieChart-${stat.class_id}`;
      const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const pieChart = new Chart(context, {
        type: 'pie',
        data: {
          labels: ['Completed', 'Not Completed'],
          datasets: [{
            data: [stat.completed, stat.not_completed],
            backgroundColor: [
              '#15957F',
              '#E5E7EB'
            ],
            borderColor: [
              '#0A7664',
              '#D1D5DB'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
            },
            title: {
              display: true,
              text: stat.class_name || `Class ${stat.class_id}`
            }
          }
        }
      });

      this.pieCharts.set(stat.class_id, pieChart);
    });
  }

  openReportModal() {
    const today = new Date();
    this.selectedReportYear = today.getFullYear().toString();
    this.selectedReportMonth = (today.getMonth() + 1).toString();
    this.selectedReportWeek = this.getWeekNumber(today);
    this.showReportModal = true;
  }

  closeReportModal() {
    this.showReportModal = false;
  }

  getWeekNumber(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo.toString();
  }

  getWeekDates(year: number, week: number): { start: Date; end: Date } {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4) {
      ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    } else {
      ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    }
    const ISOweekEnd = new Date(ISOweekStart);
    ISOweekEnd.setDate(ISOweekStart.getDate() + 6);
    return { start: ISOweekStart, end: ISOweekEnd };
  }

  generateReport() {
    if (!this.currentAdminId) return;

    const adminIdParam = `&admin_id=${this.currentAdminId}`;
    let filteredActivityData: any[] = [];
    let filteredCompletionStats: any[] = [];

    if (this.reportType === 'week') {
      const year = parseInt(this.selectedReportYear);
      const week = parseInt(this.selectedReportWeek);
      const { start, end } = this.getWeekDates(year, week);
      
      // Calculate days needed for the week
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const daysToFetch = Math.max(daysDiff, 7);
      
      // Fetch data for the week
      this.http.get(`${environment.apiUrl}/routes.php?request=getDailyStudentActivity${adminIdParam}&days=${daysToFetch}`).subscribe({
        next: (response: any) => {
          if (response.status?.remarks === 'success' && response.payload) {
            const weekData = response.payload.filter((d: any) => {
              const date = new Date(d.date);
              return date >= start && date <= end;
            });
            this.generateReportPDF(weekData, this.classCompletionStats, 'week');
          }
        },
        error: (error) => {
          console.error('Error fetching week activity:', error);
          this.generateReportPDF([], this.classCompletionStats, 'week');
        }
      });
      return;
    } else {
      const year = parseInt(this.selectedReportYear);
      const month = parseInt(this.selectedReportMonth);
      
      // Calculate days in the month
      const daysInMonth = new Date(year, month, 0).getDate();
      const daysToFetch = Math.max(daysInMonth, 31);
      
      // Fetch data for the entire month
      this.http.get(`${environment.apiUrl}/routes.php?request=getDailyStudentActivity${adminIdParam}&days=${daysToFetch}`).subscribe({
        next: (response: any) => {
          if (response.status?.remarks === 'success' && response.payload) {
            const monthData = response.payload.filter((d: any) => {
              const date = new Date(d.date);
              return date.getFullYear() === year && date.getMonth() + 1 === month;
            });
            this.generateReportPDF(monthData, this.classCompletionStats, 'month');
          }
        },
        error: (error) => {
          console.error('Error fetching month activity:', error);
          this.generateReportPDF([], this.classCompletionStats, 'month');
        }
      });
      return;
    }
  }

  private generateReportPDF(filteredActivityData: any[], filteredCompletionStats: any[], reportType: 'week' | 'month') {

    const doc = new jsPDF();
    const today = new Date();
    const dateStr = today.toLocaleDateString();

    let reportTitle = 'Coach Dashboard Report';
    let reportSubtitle = `Generated: ${dateStr}`;
    
    if (reportType === 'week') {
      const { start, end } = this.getWeekDates(parseInt(this.selectedReportYear), parseInt(this.selectedReportWeek));
      reportTitle = `Coach Dashboard Report - Week ${this.selectedReportWeek}, ${this.selectedReportYear}`;
      reportSubtitle = `${start.toLocaleDateString()} to ${end.toLocaleDateString()}`;
    } else {
      const monthName = new Date(parseInt(this.selectedReportYear), parseInt(this.selectedReportMonth) - 1).toLocaleString('default', { month: 'long' });
      reportTitle = `Coach Dashboard Report - ${monthName} ${this.selectedReportYear}`;
      reportSubtitle = `Generated: ${dateStr}`;
    }

    doc.setFontSize(18);
    doc.text(reportTitle, 14, 18);
    doc.setFontSize(11);
    doc.text(reportSubtitle, 14, 26);

    const activeToday = (() => {
      if (filteredActivityData.length > 0) {
        const latest = filteredActivityData[filteredActivityData.length - 1];
        return latest.active_students || 0;
      }
      return 0;
    })();

    autoTable(doc, {
      startY: 34,
      head: [['Metric', 'Value']],
      body: [
        ['Total Students', String(this.totalStudents || 0)],
        ['Total Classes', String(this.totalClasses || 0)],
        ['Active Students', String(activeToday)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [10, 118, 100] },
      styles: { cellPadding: 3 }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 8;

    if (filteredActivityData.length > 0) {
      const activityRows = filteredActivityData.map((d: any) => [
        new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        String(d.active_students || 0)
      ]);
      autoTable(doc, {
        startY: currentY,
        head: [['Date', 'Active Students']],
        body: activityRows,
        theme: 'grid',
        headStyles: { fillColor: [10, 118, 100] },
      });
      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    if (filteredCompletionStats.length > 0) {
      const classRows = filteredCompletionStats.map((s: any) => {
        const total = (s.completed || 0) + (s.not_completed || 0);
        const rate = total > 0 ? Math.round((s.completed / total) * 100) : 0;
        const enrolled = s.total_enrolled ?? total;
        return [s.class_name || `Class ${s.class_id}`, String(enrolled), String(s.completed || 0), String(s.not_completed || 0), `${rate}%`];
      });
      autoTable(doc, {
        startY: currentY,
        head: [['Class', 'Enrolled', 'Completed', 'Not Completed', 'Completion Rate']],
        body: classRows,
        theme: 'grid',
        headStyles: { fillColor: [10, 118, 100] },
      });
    }

    const fileName = reportType === 'week' 
      ? `coach_dashboard_report_week_${this.selectedReportWeek}_${this.selectedReportYear}.pdf`
      : `coach_dashboard_report_${this.selectedReportMonth}_${this.selectedReportYear}.pdf`;
    doc.save(fileName);
    this.closeReportModal();
  }

  ngOnDestroy() {
    if (this.lineChart) {
      this.lineChart.destroy();
    }
    this.pieCharts.forEach((chart) => {
      chart.destroy();
    });
    this.pieCharts.clear();
  }
}
