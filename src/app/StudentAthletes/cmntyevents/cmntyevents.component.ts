import { Component } from '@angular/core';
import { SidenavComponent } from '../sidenav/sidenav.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { HttpClient } from '@angular/common/http';
import { EventService } from '../../Coaches/services/event.service';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  end_time:string;
  location: string;
  attendees: number;
  status: 'Upcoming' | 'Completed' | 'Pending';
  image?: string;
  duration: string;
}

interface EventStats {
  total_events: number;
  upcoming_events: number;
  completed_events: number;
  pending_events: number;
  total_attendees: number;
}

@Component({
  selector: 'app-cmntyevents',
  imports: [SidenavComponent, NavbarComponent, CommonModule, FormsModule],
  templateUrl: './cmntyevents.component.html',
  styleUrl: './cmntyevents.component.css'
})
export class CmntyeventsComponent {
  stats: EventStats = {
    total_events: 0,
    upcoming_events: 0,
    completed_events: 0,
    pending_events: 0,
    total_attendees: 0
  };

  isNavOpen = true;
  isLoading = false;

  events: Event[] = [];
  defaultImageUrl = 'https://placehold.co/400x300?text=No+Image';
  apiBaseUrl = 'http://localhost/demoproj1';
  completedEvents: Event[] = [];
  filteredEvents: Event[] = [];

  private checkEventStatusInterval: any;

  constructor(private http: HttpClient, private eventService: EventService) { }

  ngOnInit() {
    this.loadEvents();
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

  onNavToggled(isOpen: boolean) {
    this.isNavOpen = isOpen;
  }

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
        // this.loadStats();
      }
    });
  }

  

  ngOnDestroy() {
    if (this.checkEventStatusInterval) {
      clearInterval(this.checkEventStatusInterval);
    }
  }

  private calculateDuration(startTime: string, endTime: string): string {
    const start = new Date(`1970-01-01T${startTime}`);
    const end = new Date(`1970-01-01T${endTime}`);
    
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
}
