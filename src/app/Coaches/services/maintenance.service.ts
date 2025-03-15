import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MaintenanceStats {
  // total_requests: number;
  open_requests: number;
  in_progress: number;
  completed_this_week: number;
  // high_priority_percentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private apiUrl = `${environment.apiUrl}/modules`;

  constructor(private http: HttpClient) {}

  getMaintenanceStats(): Observable<{
    status: string;
    message: string;
    data: MaintenanceStats;
  }> {
    return this.http.get<any>(`${this.apiUrl}/get.php`, {
      params: { action: 'getMaintenanceStats' }
    });
  }
} 