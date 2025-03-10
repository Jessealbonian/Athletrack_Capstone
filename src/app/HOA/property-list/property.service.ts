import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private apiUrl = 'http://localhost/DEMO2/demoproject/api/'; 

  constructor(private http: HttpClient) {}

  getProperties(): Observable<any> {
    return this.http.get(`${this.apiUrl}get_properties`);
  }

  addProperty(propertyData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}add_property`, propertyData);
  }

  
}