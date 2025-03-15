import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Resident {
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

export interface ResidentStats {
  total: number;
  active: number;
  pending: number;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})

export class ResidentsService {
  private apiUrl = `${environment.apiUrl}/modules`;

  constructor(private http: HttpClient) {}

  private handleFormData<T extends Record<string, any>>(data: T): FormData {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    return formData;
  }

  getResidents(): Observable<ApiResponse<Resident[]>> {
    return this.http.get<ApiResponse<Resident[]>>(`${this.apiUrl}/get.php`, {
      params: { action: 'getResidents' }
    });
  }

  getResidentStats(): Observable<ApiResponse<ResidentStats>> {
    return this.http.get<ApiResponse<ResidentStats>>(`${this.apiUrl}/get.php`, {
      params: { action: 'getResidentStats' }
    });
  }

  getPropertyAddressById(propertyId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/get.php?action=getPropertyById&id=${propertyId}`).pipe(
      map((response: ApiResponse<any>) => {
        console.log(`Response from getPropertyAddressById:`, response);
        return response;
      })
    );
  }

  addResident(resident: Resident): Observable<ApiResponse<any>> {
    const formData = this.handleFormData(resident);
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/post.php`, formData, {
      params: { action: 'addResident' }
    });
  }

  // updateResident(resident_id: number, resident: Resident): Observable<ApiResponse<any>> {
  //   const formData = this.handleFormData({ ...resident, resident_id });
  //   return this.http.post<ApiResponse<any>>(`${this.apiUrl}/post.php`, formData, {
  //     params: { action: 'updateResident' }
  //   });
  // }

  deleteResident(resident_id: number): Observable<ApiResponse<any>> {
    const formData = this.handleFormData({ resident_id });
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/post.php`, formData, {
      params: { action: 'deleteResident' }
    });
  }

  updateResidentStatus(
    resident_id: number,
    status: 'Active' | 'Pending',
    name: string,
    email: string,
    phone: string,
    move_in_date: string,  // Add move_in_date parameter
    property_id: number    // Add property_id parameter
  ): Observable<ApiResponse<any>> {
    const formData = this.handleFormData({
      resident_id,
      status,
      name,
      email,
      phone,
      move_in_date,         // Include move_in_date
      property_id           // Include property_id
    });
  
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/post.php`, formData, {
      params: { action: 'updateResidentStatus' }
    });
  }
}  