import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PropertyStatsService {
  private apiUrl = 'http://localhost/demoproj1/api/modules/getProperties.php?action=getProperties';

  constructor(private http: HttpClient) {}

  getPropertyStats(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
} 