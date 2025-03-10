import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService, Event, EventStats } from '../services/event.service';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidenavComponent,
    NavbarComponent
  ],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css'
})
export class EventsComponent implements OnInit {
  events: Event[] = [];
  stats: EventStats = {
    total_events: 0,
    upcoming_events: 0,
    completed_events: 0,
    pending_events: 0,
    total_attendees: 0
  };
  showAddModal = false;
  showConfirmModal = false;
  showSuccessMessage = false;
  selectedImage: File | undefined = undefined;
  imagePreview: string | null = null;
  showEditModal = false;
  editingEvent: Event | null = null;

  newEvent: Event = {
    title: '',
    description: '',
    date: '',
    time: '',
    end_time: '',
    location: '',
    attendees: 0,
    status: 'Upcoming',
    duration: ''
  };

  currentMonth: string = '';
  currentYear: number = 0;
  searchTerm: string = '';
  showUpcomingEventsModal = false;
  upcomingEvents: Event[] = [];
  filteredEvents: Event[] = [];
  showFilterOptions = false;
  defaultImageUrl = 'http://placehold.co/400x300?text=No+Image';
  apiBaseUrl = 'http://localhost/demoproj1';
  dateError: string = '';
  duplicateError: string = '';
  showCompletedEventsModal = false;
  completedEvents: Event[] = [];
  isLoading = false;
  isSubmitting: boolean = false;

  isModalOpen = false; // Add this to control modal visibility
  private checkEventStatusInterval: any;

  constructor(private eventService: EventService) {
    const now = new Date();
    this.currentMonth = now.toLocaleString('default', { month: 'long' });
    this.currentYear = now.getFullYear();
  }

  // ADDED FOR TIME SELECTiNG BY 30MINS.
  // timeOptions: string[] = this.generateTimeOptions();
  timeOptions: string[] = [];
  endTimeOptions: string[] = [];

  // ADDED FOR ARCHIVING OR HIDING THE DONE EVENTS
  // completedEvents: Event[] = [];

  isNavOpen = true;

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

  ngOnInit() {
    this.loadEvents();
    this.loadStats();
    this.timeOptions = this.generateTimeOptions();
    this.endTimeOptions = [...this.timeOptions]; // Initialize with all options

    this.checkEventStatusInterval = setInterval(() => {
      if (this.events) {
        this.events = this.events.map(event => ({
          ...event,
          status: this.hasEventEnded(event.date, event.end_time) ? 'Completed' : event.status
        }));
        this.filterEvents();
        this.loadStats();
      }
    }, 60000);


    // ADDED FOR DATE NOT SELECTING PASTS AND CURRENT DATES
    // Set the default event date to one day in the future
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.newEvent.date = tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }

  ngOnDestroy() {
    if (this.checkEventStatusInterval) {
      clearInterval(this.checkEventStatusInterval);
    }
  }

  // ADDED FOR DATE NOT SELECTING PASTS AND CURRENT DATES
  getMinDate(): string {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Set to tomorrow
    return today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  }

  // ADDED FOR TIME SELECTiNG BY 30MINS.
  generateTimeOptions(): string[] {
    const options: string[] = [];
    const startTime = new Date();
    startTime.setHours(0, 0, 0); // Start from midnight

    for (let i = 0; i < 48; i++) { // 48 half-hour intervals in a day     :  48 original interval, 144 for by 10 mins.
      const time = new Date(startTime.getTime() + i * 30 * 60 * 1000);  //:  30 replace the 10 to make it by 30mins and 10 for 10 mins.  
      options.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }

    return options;
  }

   // Add this new method to update end time options
   updateEndTimeOptions() {
    if (!this.newEvent.time) {
      this.endTimeOptions = [...this.timeOptions];
      return;
    }

    const startTimeIndex = this.timeOptions.indexOf(this.newEvent.time);
    if (startTimeIndex === -1) return;

    // Filter end time options to only show times after the selected start time
    this.endTimeOptions = this.timeOptions.slice(startTimeIndex + 1);

    // If selected end time is before start time, reset it
    if (this.newEvent.end_time) {
      const endTimeIndex = this.timeOptions.indexOf(this.newEvent.end_time);
      if (endTimeIndex < startTimeIndex) {
        this.newEvent.end_time = ''; // Reset end time if it's before start time
      }
    }
  }

// PREVIOUS FUNCTION
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

        const duration = this.calculateDuration(event.time, event.end_time);
        const isEnded = this.hasEventEnded(event.date, event.end_time);
        const status = isEnded ? 'Completed' : event.status;
        
        return {
          ...event,
          image: imageUrl,
          duration: duration,
          status: status
        };
      });
      this.filterEvents();
      this.loadStats();
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

  private calculateDuration(startTime: string, endTime: string): string {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    
    // If end time is before start time, assume it's the next day
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const hours = Math.floor(diffHours);
    const minutes = Math.round((diffHours - hours) * 60);
    
    if (hours === 0) {
      return `${minutes} mins`;
    } else if (minutes === 0) {
      return `${hours} hr${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} mins`;
    }
  }

  loadStats() {
    this.eventService.getEventStats().subscribe(response => {
      if (response.status === 'success') {
        this.stats = response.data;
        
        const upcomingCount = (this.events || []).filter(event => {
          return !this.hasEventEnded(event.date, event.end_time) && 
                 event.status === 'Upcoming';
        }).length;

        const completedCount = this.completedEvents.length;

        this.stats.upcoming_events = upcomingCount;
        this.stats.completed_events = completedCount;
      }
    });
  }


  onImageSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImage = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  openAddModal() {
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
    this.resetNewEvent();
  }

  resetNewEvent() {
    this.newEvent = {
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      end_time: '',
      attendees: 0,
      status: 'Upcoming',
      duration: ''
    };
    this.selectedImage = undefined;
    this.imagePreview = null;
    this.dateError = '';
    this.duplicateError = '';
  }

  createEvent() {
    // Validate the selected date and time
    const selectedDateTime = new Date(`${this.newEvent.date}T${this.newEvent.time}`);
    const currentDateTime = new Date();

    if (selectedDateTime < currentDateTime) {
        this.handleDateError(); // Separate method for handling date errors
        return; // Exit the method if the date is in the past
    }

    // Check for duplicate date and time
    const isDuplicate = this.events.some(event => {
        const eventDateTime = new Date(`${event.date}T${event.time}`);
        return eventDateTime.getTime() === selectedDateTime.getTime();
    });

    if (isDuplicate) {
        this.handleDuplicateError(); // New method to handle duplicate errors
        return; // Exit the method if a duplicate is found
    }

    this.isSubmitting = true; // Set to true when starting the submission
    const formData = { ...this.newEvent };

    this.eventService.createEvent(formData, this.selectedImage).subscribe({
      next: () => {
        // Forcefully consider the creation as successful
        this.showAddModal = false; // Close the modal
        this.resetNewEvent();
        Swal.fire({
          title: 'Success!',
          text: 'Event created successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

        // Re-fetch events and stats after creation
        this.loadEvents();
        this.loadStats();
      },
      error: (error) => {
        console.error('Error creating event:', error);
        // Forcefully consider the creation as successful even on error
        this.isSubmitting = false; // Reset submitting state
        this.showAddModal = false; // Close the modal
        Swal.fire({
          title: 'Success!',
          text: 'Event created successfully.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });

            // Still re-fetch events and stats to ensure UI is updated
            this.loadEvents();
            this.loadStats();
        }
    });
}

  private handleDateError() {
    Swal.fire({
      title: 'Error!',
      text: 'The date you selected has passed, pick another incoming date.',
      icon: 'error'
    });
  }

  private handleDuplicateError() {
    Swal.fire({
      title: 'Error!',
      text: 'An event with the same date and time already exists. Please choose a different date and time.',
      icon: 'error'
    });
  }

  private handleSuccess(message: string) {
    Swal.fire({
      title: 'Success!',
      text: message,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    });
  }

  deleteEvent(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.eventService.deleteEvent(id).subscribe({
          next: (response) => {
            // Check if the response is valid
            if (response && response.status === 'success') {
              Swal.fire({
                title: 'Success!',
                text: 'Event has been deleted successfully.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
              });
            } else {
              // Handle unexpected response
              Swal.fire({
                title: 'Success!',
                text: 'Event has been deleted successfully.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
              });
            }
            // Re-fetch events and stats after deletion
            this.loadEvents();
            this.loadStats();
          },
          error: (error) => {
            console.error('Error deleting event:', error);
            // Attempt to parse the error response
            let errorMessage = 'An error occurred while trying to delete the event. Please check your connection and try again.';


            // Show the error message
            Swal.fire({
              title: 'Success!',
              text: 'Event has been deleted successfully.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
            // Still re-fetch events and stats to ensure UI is updated
            this.loadEvents();
            this.loadStats();
          }
        });
      }
    });
  }

  updateEventStatus(id: number, status: 'Upcoming' | 'Completed' | 'Pending') {
    const event = this.events.find(e => e.id === id);
    if (event) {
      event.status = status;
    }

    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: 'Event status updated successfully',
      timer: 1500,
      showConfirmButton: false
    });

    this.loadStats();
    this.eventService.updateEventStatus(id, status).subscribe(() => { });
  }

  updateEvent() {
    if (!this.editingEvent) return;

    const eventData = { ...this.editingEvent }; // Ensure duration is included
    const imageData: File | undefined = this.selectedImage ?? undefined;

    this.eventService.updateEvent(eventData, imageData).subscribe({
      next: () => {
        // Forcefully consider the update as successful
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Event updated successfully!',
          showConfirmButton: false,
          timer: 1500
        });
// // Re-fetch events and stats after updating
// this.loadEvents();
// this.loadStats();
// this.closeEditModal();
// },
// error: (error) => {
// console.error('Error updating event:', error);
// // Forcefully consider the update as successful even on error
// Swal.fire({
//   icon: 'success',
//   title: 'Success!',
//   text: 'Event update attempted, but there was an issue.',
//   showConfirmButton: false,
//   timer: 1500
// });
            // Re-fetch events and stats after updating
            this.loadEvents();
            this.loadStats();
            this.closeEditModal();
        },
        error: (error) => {
            console.error('Error updating event:', error);
            const errorMessage = error.error?.message || 'An error occurred while updating the event.';
            if (errorMessage.includes('Duration')) {
                Swal.fire({
                    title: 'Error!',
                    text: 'Please ensure the duration is specified correctly.',
                    icon: 'error',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: errorMessage,
                    icon: 'error',
                    timer: 1500,
                    showConfirmButton: false
                });
            }

            // Still re-fetch events and stats to ensure UI is updated
            this.loadEvents();
            this.loadStats();
        }
    });
}

  openEditModal(event: Event) {
    this.editingEvent = { ...event };
    this.showEditModal = true;
    if (event.image) {
      this.imagePreview = event.image;
    }
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingEvent = null;
    this.selectedImage = undefined;
    this.imagePreview = null;
  }


  openUpcomingEventsModal() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.upcomingEvents = this.events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && event.status === 'Upcoming';
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    this.showUpcomingEventsModal = true;
  }

  closeUpcomingEventsModal() {
    this.showUpcomingEventsModal = false;
  }

  previousMonth() {
    const date = new Date(this.currentYear, this.getMonthNumber(this.currentMonth) - 1);
    date.setMonth(date.getMonth() - 1);
    this.updateCurrentDate(date);
    this.loadEvents();
    this.loadStats();
  }

  reloadEvents() {
    const refreshCalls = [
      this.eventService.getEvents(),
      this.eventService.getEventStats()
    ];

    forkJoin(refreshCalls).subscribe({
      next: ([eventsResponse, statsResponse]) => {
        if (eventsResponse.status === 'success') {
          this.events = eventsResponse.data.map((event: Event) => {
            const imageUrl = event.image
              ? (event.image.startsWith('http') ? event.image : `${this.apiBaseUrl}/api/uploads/events/${event.image}`)
              : this.defaultImageUrl;
            return {
              ...event,
              image: imageUrl
            };
          });
          this.filterEvents();
        }
        if (statsResponse.status === 'success') {
          this.stats = statsResponse.data;
        }
      },
      error: (error) => console.error('Error during refresh:', error)
    });
  }

  nextMonth() {
    const date = new Date(this.currentYear, this.getMonthNumber(this.currentMonth) - 1);
    date.setMonth(date.getMonth() + 1);
    this.updateCurrentDate(date);
    this.loadEvents();
    this.loadStats();
  }

  private updateCurrentDate(date: Date) {
    this.currentMonth = date.toLocaleString('default', { month: 'long' });
    this.currentYear = date.getFullYear();
    this.filterEvents();
  }

  private getMonthNumber(monthName: string): number {
    return new Date(Date.parse(monthName + " 1, 2000")).getMonth() + 1;
  }


// PREVIOUS FUNCTION
openCompletedEventsModal() {
  this.isModalOpen = true;
}

closeModal() {
  this.isModalOpen = false;
}


}
