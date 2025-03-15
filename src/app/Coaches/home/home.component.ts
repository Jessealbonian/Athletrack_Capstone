import { Component, AfterViewInit } from '@angular/core';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { Chart, registerables } from 'chart.js';
import { EventService, Event } from '../services/event.service';
import { PaymentService, PaymentStats } from '../services/payment.service';
import { MaintenanceService, MaintenanceStats } from '../services/maintenance.service';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { PropertyStatsService } from '../services/property-stats.service';
//import { PropertyService } from '../property-list/property.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2';
import { catchError, finalize } from 'rxjs';
import { AuthService } from '../../auth.service';
import { ResidentsService } from '../services/residents.service';

Chart.register(...registerables); // Register Chart.js components

enum ReportSection {
  ALL = 'All Sections',
  SUMMARIES = 'Summaries Only',
  EVENTS = 'Events Information',
  RESIDENTS = 'Residents Information',
  MAINTENANCE = 'Maintenance Information'
}

interface Property {
    prop_name: string;
    prop_status: string;
    // Add other relevant fields as necessary
}

interface Resident {
  resident_id?: number;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Pending';
  move_in_date: string;
  property_id: number;
  property_address?: string;
  created_at?: string;
  updated_at?: string;
}

interface MaintenanceRequest {
  id: number;
  address: string;
  resident_name: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  request_date: string;
  assigned_to: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SidenavComponent, NavbarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements AfterViewInit {
  isNavOpen = true;
  upcomingEvents: Event[] = [];
  completedEvents: Event[] = [];
  filteredEvents: Event[] = [];
  events: Event[] = [];
  private checkEventStatusInterval: any;

  showUpcomingEventsModal = false;

  // New properties for total properties and occupied properties
  totalProperties: number = 0;
  occupiedProperties: number = 0;

  // New properties for payment overview
  monthlyDuesCollection: number = 0;
  outstandingPayment: number = 0;
  specialAssessmentFunds: number = 0;

  // New properties for maintenance stats
  public maintenanceStats: MaintenanceStats = {
    open_requests: 0,
    in_progress: 0,
    completed_this_week: 0
  };

  // New properties for property management
  allProperties: any[] = []; // Declare allProperties
  filteredProperties: any[] = []; // Declare filteredProperties
  properties: Property[] = [];

  userId: number = 0;
  profile: any;
  name:  any;

  isLoading = false;
  defaultImageUrl = 'http://placehold.co/400x300?text=No+Image';
  apiBaseUrl = 'http://localhost/demoproj1';

  maintenanceRequests: MaintenanceRequest[] = [];

  selectedMonth: string = '';
  selectedYear: string = '';

  // Add these properties to the class
  availableDates: { month: number; year: number; }[] = [];

  // Add this property to store residents
  residents: Resident[] = [];

  // Add these properties
  pendingRequests: MaintenanceRequest[] = [];
  inProgressRequests: MaintenanceRequest[] = [];
  completedRequests: MaintenanceRequest[] = [];

  constructor(
    private eventService: EventService,
    private paymentService: PaymentService,
    private maintenanceService: MaintenanceService,
    private propertyStatsService: PropertyStatsService,
    //private propertyService: PropertyService,
    private http: HttpClient,
    private auth: AuthService,
    private residentsService: ResidentsService  // Add this service
  ) {
    this.totalProperties = 0; // Initialize total properties
    this.occupiedProperties = 0; // Initialize occupied properties
    // this.loadUpcomingEvents();
    //this.loadPropertyStats(); // Load property stats on initialization
    this.loadPaymentStats(); // Load payment stats on initialization
    this.loadMaintenanceStats(); // Load maintenance stats on initialization
    //this.fetchProperties();
    this.loadEvents();
    this.loadMaintenanceRequests();
    this.loadResidents();  // Add this line
  }

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  ngAfterViewInit() {
    this.auth.getCurrentUser().subscribe(user => {
      if (user) {
        console.log("This is the User Id", user)
        this.userId = user.id;
        console.log("This is the User Id", this.userId)
        this.getProfile(this.userId);
      } else {
        console.log("User not found");
      }
    })

    this.createChart();
    this.filterEvents();
    this.checkEventStatusInterval = setInterval(() => {
      if (this.events) {
        this.events = this.events.map(event => ({
          ...event,
          status: this.hasEventEnded(event.date, event.end_time) ? 'Completed' : event.status
        }));
        this.filterEvents();
        // this.loadStats();
      }
    }, 60000);
  }

  getProfile(userId: any): void {
    if (!userId) {
      console.error("User ID is required");
      return;
    }
  
    const url = `http://localhost/DEMO2/demoproject/api/getHoaAdminProf/${userId}`;
  
    this.http.get(url).subscribe({
      next: (resp: any) => {
        if (resp && resp.data && Array.isArray(resp.data) && resp.data.length > 0) {
          const profile = resp.data[0]; // Assuming `data` is an array with the profile object
          this.profile = profile;
          this.name = profile.username; // Assuming `username` maps to the "name" you want
          console.log("Profile fetched successfully:", this.profile);
        } else {
          console.error("No profile data found.");
        }
      },
      error: (error) => {
        console.error("Error fetching profile:", error);
      }
    });
  }


  private hasEventEnded(eventDate: string, endTime: string): boolean {
    const now = new Date();
    const eventDateTime = new Date(`${eventDate}T${endTime}`);
    return now > eventDateTime;
  }

  filterEvents() {
    // Update both filtered and completed events
    this.completedEvents = this.events.filter(event => 
      this.hasEventEnded(event.date, event.end_time) || 
      event.status === 'Completed'
    );

    this.filteredEvents = this.events.filter(event => {
      const isEnded = this.hasEventEnded(event.date, event.end_time);
      return !isEnded && event.status !== 'Completed';
    });
  }

  private createChart() {
    const ctx = document.getElementById('lineChart') as HTMLCanvasElement;
    const context = ctx.getContext('2d');
    if (context) {
      const lineChart = new Chart(context, {
        type: 'line',
        data: {
          labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
          datasets: [{
            label: 'Data Trends',
            data: [65, 59, 80, 81, 56, 55, 40],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 1,
            fill: true,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    } else {
      console.error('Failed to get canvas context');
    }
  }

  // private loadUpcomingEvents() {
  //   this.eventService.getEvents().subscribe(response => {
  //     if (response.status === 'success') {
  //       const today = new Date();
  //       today.setHours(0, 0, 0, 0);
  //       this.upcomingEvents = response.data
  //         .filter((event: Event) => {
  //           const eventDate = new Date(event.date);
  //           return eventDate >= today && event.status === 'Upcoming';
  //         });
  //         this.completedEvents = response.data
  //         .filter((event: Event) => {
  //           const eventDate = new Date(event.date);
  //           return eventDate >= today && event.status === 'Completed';
  //         });
  //         // .slice(0, 5); // Limit to only 3 events
  //          this.filterEvents();
  //     }
  //   });
  // }

  loadEvents() {
    this.isLoading = true;
    this.eventService.getEvents().pipe(
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe(response => {
      if (response.status === 'success') {
        this.events = (response.data || []).map((event: Event) => {
          const imageUrl = event.image
            ? (event.image.startsWith('http') ? event.image : `${this.apiBaseUrl}/api/uploads/events/${event.image}`)
            : this.defaultImageUrl;
  
          // const duration = this.calculateDuration(event.time, event.end_time);
          const isEnded = this.hasEventEnded(event.date, event.end_time);
          const status = isEnded ? 'Completed' : event.status;
          
          return {
            ...event,
            image: imageUrl,
            // duration: duration,
            status: status
          };
        });
        this.filterEvents();
        // this.loadStats();
      }
    });
  }

  // private loadPropertyStats() {
  //   this.propertyStatsService.getPropertyStats().subscribe(
  //       (response: any) => {
  //           console.log('API Response:', response); // Log the entire response
  //           if (response.status === 'success') {
  //               const properties: Property[] = response.data; // Get the properties data
  //               console.log('Fetched Properties:', properties); // Log the fetched properties
  //               this.totalProperties = properties.length; // Total properties
  //               // Count properties that are not "For Sale" or "For Rent"
  //               this.occupiedProperties = properties.filter(property => 
  //                   property.prop_status !== 'For Sale' && property.prop_status !== 'For Rent'
  //               ).length; // Count occupied properties
                
  //               console.log('Total Properties:', this.totalProperties);
  //               console.log('Occupied Properties:', this.occupiedProperties);
  //           } else {
  //               console.error('Failed to load property stats');
  //           }
  //       },
  //       error => {
  //           console.error('Error fetching property stats:', error);
  //       }
  //   );
  // }

  // fetchProperties() {
  //   this.propertyService.getProperties().subscribe(
  //     (response: any) => {
  //       // Ensure the response and payload structure is valid
  //       if (response?.payload && Array.isArray(response.payload)) {
  //         const properties: Property[] = response.payload; // Specify the type here

  //         // Assign fetched properties
  //         this.allProperties = properties;
  //         this.filteredProperties = [...properties];
  //         this.properties = [...this.filteredProperties];

  //         // Calculate total properties
  //         this.totalProperties = properties.length;

  //         // Calculate occupied properties
  //         this.occupiedProperties = properties.filter((property: Property) => 
  //           property.prop_status !== 'For Sale' && property.prop_status !== 'For Rent'
  //         ).length;

  //         // Log results for debugging
  //         console.log('Total Properties:', this.totalProperties);
  //         console.log('Occupied Properties:', this.occupiedProperties);
  //         console.log('Property Statuses:', properties.map(p => p.prop_status));
  //       } else {
  //         // Handle unexpected response structure
  //         console.error('Invalid API response structure:', response);
  //       }
  //     },
  //     (error: any) => {
  //       // Handle HTTP or network errors
  //       console.error('Error fetching properties:', error);
  //     }
  //   );
  // }
  
  
  private loadPaymentStats() {
    this.paymentService.getPaymentStats().subscribe(response => {
      if (response.status === 'success') {
        const stats: PaymentStats = response.data;
        this.monthlyDuesCollection = stats.total_collections; // Assuming this is the total for the current month
        this.outstandingPayment = stats.overdue_amount; // Assuming overdue amount is the outstanding payment
        this.specialAssessmentFunds = stats.pending_amount; // Assuming pending amount is for special assessments
      }
    });
  }

  private loadMaintenanceStats() {
    this.maintenanceService.getMaintenanceStats().subscribe(response => {
      if (response.status === 'success') {
        this.maintenanceStats = response.data; // Assuming the response contains the stats
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  }

  // Add this function to get available dates from maintenance requests
  private getAvailableDates(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Collect dates from all relevant data sources
    const dates = [
      ...this.maintenanceRequests.map(request => this.formatDateForFilter(request.request_date)),
      ...this.events.map(event => this.formatDateForFilter(event.date)),
      ...this.residents.map(resident => this.formatDateForFilter(resident.move_in_date))
    ];

    // Remove duplicates, filter out future dates, and sort in descending order
    this.availableDates = dates
      .filter((date, index, self) => 
        index === self.findIndex(d => d.month === date.month && d.year === date.year)
      )
      .filter(date => {
        // Allow current month/year and past dates only
        return date.year < currentYear || 
               (date.year === currentYear && date.month <= currentMonth);
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }

  // Update the generateYearOptions to show all years with data
  private generateYearOptions(): string {
    const years = [...new Set(this.availableDates.map(date => date.year))];
    years.sort((a, b) => b - a); // Sort years in descending order
    
    let options = '<option value="">Select Year</option>';
    years.forEach(year => {
      options += `<option value="${year}">${year}</option>`;
    });
    return options;
  }

  // Update generateMonthOptions to show all months with data for the selected year
  private generateMonthOptions(selectedYear: string): string {
    const availableMonths = this.availableDates
      .filter(date => date.year === parseInt(selectedYear))
      .map(date => date.month);

    // Remove duplicates and sort
    const uniqueMonths = [...new Set(availableMonths)].sort((a, b) => b - a);

    let options = '<option value="">Select Month</option>';
    uniqueMonths.forEach(monthNum => {
      const monthName = new Date(2000, monthNum - 1).toLocaleString('default', { month: 'long' });
      options += `<option value="${monthNum}">${monthName}</option>`;
    });
    return options;
  }

  // Modify the generateReport function to handle dynamic month options
  generateReport() {
    this.getAvailableDates();

    if (this.availableDates.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Data Available',
        text: 'There are no past maintenance requests or events to generate a report from.'
      });
      return;
    }

    // First, show section selection
    Swal.fire({
      title: 'Select Report Type',
      html: `
        <select id="sectionSelect" class="swal2-select" style="margin: 10px">
          <option value="">Select Report Section</option>
          <option value="${ReportSection.ALL}">${ReportSection.ALL}</option>
          <option value="${ReportSection.SUMMARIES}">${ReportSection.SUMMARIES}</option>
          <option value="${ReportSection.EVENTS}">${ReportSection.EVENTS}</option>
          <option value="${ReportSection.RESIDENTS}">${ReportSection.RESIDENTS}</option>
          <option value="${ReportSection.MAINTENANCE}">${ReportSection.MAINTENANCE}</option>
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Next',
      preConfirm: () => {
        const section = (document.getElementById('sectionSelect') as HTMLSelectElement).value;
        if (!section) {
          Swal.showValidationMessage('Please select a report section');
          return false;
        }
        return section;
      }
    }).then((sectionResult) => {
      if (sectionResult.isConfirmed) {
        // Show year selection
        Swal.fire({
          title: 'Select Report Year',
          html: `
            <select id="yearSelect" class="swal2-select" style="margin: 10px">
              ${this.generateYearOptions()}
            </select>
          `,
          showCancelButton: true,
          confirmButtonText: 'Next',
          preConfirm: () => {
            const year = (document.getElementById('yearSelect') as HTMLSelectElement).value;
            if (!year) {
              Swal.showValidationMessage('Please select a year');
              return false;
            }
            return { section: sectionResult.value, year };
          }
        }).then((yearResult) => {
          if (yearResult.isConfirmed) {
            // Show month selection
            Swal.fire({
              title: 'Select Report Month',
              html: `
                <select id="monthSelect" class="swal2-select" style="margin: 10px">
                  ${yearResult.value && 'year' in yearResult.value ? this.generateMonthOptions(yearResult.value.year) : ''}
                </select>
              `,
              showCancelButton: true,
              confirmButtonText: 'Generate Report',
              preConfirm: () => {
                const month = (document.getElementById('monthSelect') as HTMLSelectElement).value;
                if (!month) {
                  Swal.showValidationMessage('Please select a month');
                  return false;
                }
                if (!yearResult.value) {
                  Swal.showValidationMessage('Year data is missing');
                  return false;
                }
                return {
                  section: yearResult.value.section,
                  month,
                  year: yearResult.value.year
                };
              }
            }).then((monthResult) => {
              if (monthResult.isConfirmed && monthResult.value) {
                const { section, month, year } = monthResult.value;
                this.generatePDFReport(parseInt(month), parseInt(year), section as ReportSection);
              }
            });
          }
        });
      }
    });
  }

  // New function to generate the actual PDF with filtering
  private generatePDFReport(month: number, year: number, section: ReportSection) {
    // Filter data based on month and year
    const filteredPending = this.pendingRequests.filter(request => {
      const requestDate = new Date(request.request_date);
      return requestDate.getMonth() + 1 === month && requestDate.getFullYear() === year;
    });

    const filteredInProgress = this.inProgressRequests.filter(request => {
      const requestDate = new Date(request.request_date);
      return requestDate.getMonth() + 1 === month && requestDate.getFullYear() === year;
    });

    const filteredCompleted = this.completedRequests.filter(request => {
      const requestDate = new Date(request.request_date);
      return requestDate.getMonth() + 1 === month && requestDate.getFullYear() === year;
    });

    const filteredCompletedEvents = this.completedEvents.filter(event => {
      const eventDate = this.formatDateForFilter(event.date);
      return eventDate.month === month && eventDate.year === year;
    });

    const filteredUpcomingEvents = this.filteredEvents.filter(event => {
      const eventDate = this.formatDateForFilter(event.date);
      return eventDate.month === month && eventDate.year === year;
    });

    const filteredResidents = this.residents.filter(resident => {
      const moveInDate = this.formatDateForFilter(resident.move_in_date);
      return moveInDate.month === month && moveInDate.year === year;
    });

    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();
    const adminName = this.name || 'Admin';
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    // Initialize starting Y position
    let currentY = 20;

    // Always add title and header
    doc.setFontSize(20);
    doc.text(`HOA Management System Report - ${monthName} ${year}`, 105, currentY, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Admin Name: ${adminName}`, 14, currentY + 10);
    doc.text(`Report Generated: ${currentDate}`, 14, currentY + 20);
    currentY += 35;

    // Function to add summaries section
    const addSummaries = () => {
      doc.setFillColor(41, 128, 185);
      doc.rect(0, currentY, doc.internal.pageSize.width, 10, 'F');
      doc.setTextColor(255);
      doc.setFontSize(16);
      doc.text('Summary Report', 14, currentY + 7);
      currentY += 20;

      autoTable(doc, {
        startY: currentY,
        head: [['Category', 'Count']],
        body: [
          ['Total Events', filteredUpcomingEvents.length + filteredCompletedEvents.length],
          ['New Residents', filteredResidents.length],
          ['Total Maintenance Requests', 
            filteredPending.length + filteredInProgress.length + filteredCompleted.length]
        ],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { left: 14 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    };

    // Function to add events section
    const addEvents = () => {
      doc.setFillColor(41, 128, 185);
      doc.rect(0, currentY, doc.internal.pageSize.width, 10, 'F');
      doc.setTextColor(255);
      doc.setFontSize(16);
      doc.text(`Events Information Report - ${monthName} ${year}`, 14, currentY + 7);
      currentY += 20;

      // Events Summary Table
      autoTable(doc, {
        startY: currentY,
        head: [['Events Summary', 'Count']],
        body: [
          ['Total Upcoming Events', `${filteredUpcomingEvents.length}`],
          ['Total Completed Events', `${filteredCompletedEvents.length}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: {
          0: { cellWidth: 140 },
          1: { cellWidth: 40, halign: 'center' }
        }
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;

      // Upcoming Events Table
      if (filteredUpcomingEvents.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [['Upcoming Events', 'Date', 'Time', 'Location']],
          body: filteredUpcomingEvents.map(event => [
            event.title,
            event.date,
            `${event.time} - ${event.end_time}`,
            event.location
          ]),
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Completed Events Table
      if (filteredCompletedEvents.length > 0) {
        autoTable(doc, {
          startY: currentY,
          head: [['Completed Events', 'Date', 'Time', 'Location']],
          body: filteredCompletedEvents.map(event => [
            event.title,
            event.date,
            `${event.time} - ${event.end_time}`,
            event.location
          ]),
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
    };

    // Function to add residents section
    const addResidents = () => {
      if (filteredResidents && filteredResidents.length > 0) {
        doc.setFillColor(41, 128, 185);
        doc.rect(0, currentY, doc.internal.pageSize.width, 10, 'F');
        doc.setTextColor(255);
        doc.setFontSize(16);
        doc.text(`Resident Information Report - ${monthName} ${year}`, 14, currentY + 7);
        currentY += 20;

        doc.setTextColor(96, 96, 96);
        doc.setFontSize(10);
        doc.text(`Total New Residents: ${filteredResidents.length}`, 14, currentY);
        currentY += 15;

        autoTable(doc, {
          startY: currentY,
          head: [['Name', 'Email', 'Phone', 'Address', 'Move-in Date']],
          body: filteredResidents.map(resident => [
            resident.name,
            resident.email,
            resident.phone,
            resident.property_address || 'N/A',
            new Date(resident.move_in_date).toLocaleDateString()
          ]),
          theme: 'grid',
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
          },
          bodyStyles: {
            fontSize: 9,
            halign: 'center'
          }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      } else {
        doc.setTextColor(96, 96, 96);
        doc.setFontSize(12);
        doc.text(`No new residents found for ${monthName} ${year}`, 14, currentY);
        currentY += 20;
      }
    };

    // Function to add maintenance section
    const addMaintenance = () => {
      doc.setFillColor(41, 128, 185);
      doc.rect(0, currentY, doc.internal.pageSize.width, 10, 'F');
      doc.setTextColor(255);
      doc.setFontSize(16);
      doc.text(`Maintenance Information Report - ${monthName} ${year}`, 14, currentY + 7);
      currentY += 20;

      // Maintenance Summary
      autoTable(doc, {
        startY: currentY,
        head: [['Category', 'Count']],
        body: [
          ['Total Requests', filteredPending.length + filteredInProgress.length + filteredCompleted.length],
          ['Pending', filteredPending.length],
          ['In Progress', filteredInProgress.length],
          ['Completed', filteredCompleted.length]
        ],
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80] }
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;

      // Pending Requests Table
      if (filteredPending.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(255, 87, 34);
        doc.text('Pending Maintenance Requests', 14, currentY);
        currentY += 10;

        autoTable(doc, {
          startY: currentY,
          head: [['Address', 'Resident', 'Description', 'Date', 'Assigned To']],
          body: filteredPending.map(request => [
            request.address,
            request.resident_name,
            request.description,
            new Date(request.request_date).toLocaleDateString(),
            request.assigned_to
          ]),
          theme: 'grid',
          headStyles: { fillColor: [255, 87, 34] }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }

      // In Progress Requests Table
      if (filteredInProgress.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(33, 150, 243);
        doc.text('In Progress Maintenance Requests', 14, currentY);
        currentY += 10;

        autoTable(doc, {
          startY: currentY,
          head: [['Address', 'Resident', 'Description', 'Date', 'Assigned To']],
          body: filteredInProgress.map(request => [
            request.address,
            request.resident_name,
            request.description,
            new Date(request.request_date).toLocaleDateString(),
            request.assigned_to
          ]),
          theme: 'grid',
          headStyles: { fillColor: [33, 150, 243] }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }

      // Completed Requests Table
      if (filteredCompleted.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(76, 175, 80);
        doc.text('Completed Maintenance Requests', 14, currentY);
        currentY += 10;

        autoTable(doc, {
          startY: currentY,
          head: [['Address', 'Resident', 'Description', 'Date', 'Assigned To']],
          body: filteredCompleted.map(request => [
            request.address,
            request.resident_name,
            request.description,
            new Date(request.request_date).toLocaleDateString(),
            request.assigned_to
          ]),
          theme: 'grid',
          headStyles: { fillColor: [76, 175, 80] }
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
    };

    // Add sections based on selection
    switch (section) {
      case ReportSection.ALL:
        addSummaries();
        addEvents();
        addResidents();
        addMaintenance();
        break;
      case ReportSection.SUMMARIES:
        addSummaries();
        break;
      case ReportSection.EVENTS:
        addEvents();
        break;
      case ReportSection.RESIDENTS:
        addResidents();
        break;
      case ReportSection.MAINTENANCE:
        addMaintenance();
        break;
    }

    // Add footer
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    doc.setFillColor(41, 128, 185);
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.text(
      'Generated by HOA Management System',
      pageWidth / 2,
      pageHeight - 12,
      { align: 'center' }
    );
    doc.setFontSize(8);
    doc.text(
      'Confidential Document - For Internal Use Only',
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );

    // Save with updated filename including section
    const sectionName = section === ReportSection.ALL ? 'Complete' : section.replace(' ', '_');
    doc.save(`HOA_${sectionName}_Report_${monthName}_${year}.pdf`);
  }
  

  // Add this helper function to format dates consistently
  private formatDateForFilter(date: string): { month: number, year: number } {
    const dateObj = new Date(date);
    return {
      month: dateObj.getMonth() + 1, // JavaScript months are 0-based
      year: dateObj.getFullYear()
    };
  }

  

  loadMaintenanceRequests() {
    this.http.get(`${this.apiBaseUrl}/api/modules/get.php?action=getMaintenanceRequests`)
      .pipe(
        catchError(error => {
          console.error('Error fetching maintenance requests:', error);
          return [];
        })
      )
      .subscribe((response: any) => {
        if (response?.status === 'success' && response.data) {
          this.maintenanceRequests = response.data;
          
          // Filter requests by status
          this.pendingRequests = this.maintenanceRequests.filter(req => req.status === 'Pending');
          this.inProgressRequests = this.maintenanceRequests.filter(req => req.status === 'In Progress');
          this.completedRequests = this.maintenanceRequests.filter(req => req.status === 'Completed');
        }
      });
  }

  loadResidents() {
    this.residentsService.getResidents().subscribe({
        next: (response) => {
            if (response.status === 'success') {
                const residentsWithAddresses: Resident[] = [];

                // Fetch property address for each resident
                response.data.forEach((resident) => {
                    this.residentsService.getPropertyAddressById(resident.property_id).subscribe({
                        next: (propertyResponse) => {
                            if (propertyResponse.status === 'success') {
                                resident.property_address = propertyResponse.data.address;
                            } else {
                                resident.property_address = 'Unknown Address';
                            }
                            residentsWithAddresses.push(resident);

                            // Update residents array when all addresses are fetched
                            if (residentsWithAddresses.length === response.data.length) {
                                this.residents = residentsWithAddresses;
                            }
                        },
                        error: () => {
                            resident.property_address = 'Unknown Address';
                            residentsWithAddresses.push(resident);
                            
                            if (residentsWithAddresses.length === response.data.length) {
                                this.residents = residentsWithAddresses;
                            }
                        }
                    });
                });
            }
        },
        error: (error) => console.error('Error loading residents:', error)
    });
}


  // loadResidents() {
  //   this.http.get(`${this.apiBaseUrl}/api/modules/get.php?action=getResidents`)
  //     .pipe(
  //       catchError(error => {
  //         console.error('Error fetching residents:', error);
  //         return [];
  //       })
  //     )
  //     .subscribe((response: any) => {
  //       if (response?.status === 'success' && response.data) {
  //         this.residents = response.data;
  //         console.log('Loaded residents:', this.residents);
  //       }
  //     });
  // }

}





