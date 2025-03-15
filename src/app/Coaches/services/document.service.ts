import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Document {
  id?: number;
  document_name: string;
  file_path: string;
  type: 'Policy' | 'Rule' | 'Form' | 'Archived';
  last_updated: string;
  size: number;
  views: number;
}

export interface DocumentStats {
  total_documents: number;
  rules_count: number;
  forms_count: number;
}

export interface DocumentResponse {
  status: string;
  message: string;
  data: Document[];
}

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = `${environment.apiUrl}/modules`;

  constructor(private http: HttpClient) {}

  getDocuments(): Observable<DocumentResponse> {
    return this.http.get<DocumentResponse>(`${this.apiUrl}/get.php`, {
      params: { action: 'getDocuments' }
    });
  }

  getDocumentStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get.php`, {
      params: { action: 'getDocumentStats' }
    });
  }

  uploadDocument(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/post.php`, formData, {
      params: { action: 'addDocument' }
    });
  }

  deleteDocument(id: number): Observable<any> {
    const formData = new FormData();
    formData.append('id', id.toString());
    
    return this.http.post(`${this.apiUrl}/post.php`, formData, {
      params: { action: 'deleteDocument' }
    });
  }

  downloadDocument(docId: string): Observable<any> {
    return this.http.get(`/api/documents/${docId}`, {
      responseType: 'blob',
      observe: 'response'
    });
  }
} 