import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Notification {
  type: 'payment' | 'maintenance' | 'announcement';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  created_at?: string;
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/modules`;

  constructor(private http: HttpClient) {}

  createNotification(notification: Notification) {
    const formData = new FormData();
    Object.keys(notification).forEach(key => {
      formData.append(key, notification[key as keyof Notification]?.toString() || '');
    });

    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/post.php`, formData, {
      params: { action: 'createNotification' }
    });
  }

  notifyPaymentReceived(amount: number, unit: string) {
    const notification: Notification = {
      type: 'payment',
      title: 'Payment Received',
      message: `Payment of PHP ${amount.toLocaleString()} received for ${unit}`,
      priority: 'low'
    };
    return this.createNotification(notification);
  }
} 