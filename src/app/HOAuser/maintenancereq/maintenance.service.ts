import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MaintenanceRequest {
  id?: number;
  resident_name: string;
  address: string;
  issue: string;
  description: string;
  request_date: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private apiUrl = `${environment.apiUrl}/modules`;

  constructor(private http: HttpClient) { }

  getMaintenanceRequests(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get.php`, {
      params: { action: 'getMaintenance' }
    });
  }

  createMaintenanceRequest(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/post.php`, formData, {
      params: { action: 'addMaintenance' }
    });
  }

  updateMaintenanceRequest(request: MaintenanceRequest, imageFile?: File): Observable<any> {
    const formData = new FormData();
    
    Object.keys(request).forEach(key => {
      const value = request[key as keyof MaintenanceRequest];
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.http.post(`${this.apiUrl}/post.php`, formData, {
      params: { action: 'updateMaintenance' }
    });
  }

  deleteMaintenanceRequest(id: number): Observable<any> {
    const formData = new FormData();
    formData.append('id', id.toString());

    return this.http.post(`${this.apiUrl}/post.php`, formData, {
      params: { action: 'deleteMaintenance' }
    });
  }
} 