import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailListsService {
  private apiUrl = 'http://localhost/DEMO2/demoproject/api/';
  private applicationsUpdated = new BehaviorSubject<void>(undefined);

  constructor(private http: HttpClient) {}

  transferUserEmails(applicationId: number, email_transfer: 'Sent') {
    return this.http.post('http://localhost/DEMO2/demoproject/api/transferUserEmails', {
      appl_id: applicationId,
      email_transfer: email_transfer
    });
  }

  
}