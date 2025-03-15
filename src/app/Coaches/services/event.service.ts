import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Event {
  id?: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  end_time: string;
  attendees: number;
  status: 'Upcoming' | 'Completed' | 'Pending';
  image?: string;
  created_at?: string;
  updated_at?: string;
  duration: string;
}

export interface EventStats {
  total_events: number;
  upcoming_events: number;
  completed_events: number;
  pending_events: number;
  total_attendees: number;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = `${environment.apiUrl}/modules`;

  constructor(private http: HttpClient) { }

  getEvents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get.php`, {
      params: { action: 'getEvents' }
    });
  }

  getEventStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get.php`, {
      params: { action: 'getEventStats' }
    });
  }

  createEvent(event: Event, imageFile?: File): Observable<any> {
    const formData = new FormData();
    Object.keys(event).forEach(key => {
      const value = event[key as keyof Event];
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.http.post(`${this.apiUrl}/post.php`, formData, {
      params: { action: 'addEvent' }
    });
  }

  updateEvent(event: Event, imageFile?: File): Observable<any> {
    const formData = new FormData();
    Object.keys(event).forEach(key => {
      const value = event[key as keyof Event];
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.http.post(`${this.apiUrl}/post.php`, formData, { params: { action: 'updateEvent' } });
  }

  deleteEvent(id: number): Observable<any> {
    const formData = new FormData();
    formData.append('id', id.toString());

    return this.http.post(`${this.apiUrl}/post.php`, formData, {
      params: { action: 'deleteEvent' }
    });
  }

  updateEventStatus(id: number, status: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/post.php`, null, {
      params: { action: 'updateEventStatus', id: id.toString(), status }
    });
  }

  getEventsByMonth(year: number, month: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get.php`, {
      params: { 
        action: 'getEvents',
        year: year.toString(),
        month: (month + 1).toString()
      }
    });
  }

  getUpcomingEvents(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get.php`, {
      params: { action: 'getUpcomingEvents' }
    });
  }

  getCompletedEvents(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/completed-events`);
  }
}