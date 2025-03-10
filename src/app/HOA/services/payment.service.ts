import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';

export interface Payment {
  payment_id?: number;
  date: string;
  unit: string;
  resident_name: string;
  amount: number;
  block: string;
  lot: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  created_at?: string;
  updated_at?: string;
}

export interface PaymentStats {
  total_collections: number;
  pending_amount: number;
  overdue_amount: number;
}

export interface CommunityStats {
  total_units: number;
  occupied_units: number;
  payment_compliance: number;
}

interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/modules`;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  // Get all payments
  getPayments(): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${this.apiUrl}/get.php`, {
      params: { action: 'getPayments' }
    });
  }

  // Get payment statistics
  getPaymentStats(): Observable<ApiResponse<PaymentStats>> {
    return this.http.get<ApiResponse<PaymentStats>>(`${this.apiUrl}/get.php`, {
      params: { action: 'getPaymentStats' }
    });
  }

  // Create new payment
  createPayment(payment: Payment): Observable<ApiResponse<null>> {
    const formData = new FormData();
    Object.keys(payment).forEach(key => {
      const value = payment[key as keyof Payment];
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    return new Observable(observer => {
      this.http.post<ApiResponse<null>>(`${this.apiUrl}/post.php`, formData, {
        params: { action: 'addPayment' }
      }).subscribe({
        next: (response) => {
          this.notificationService.notifyPaymentReceived(
            payment.amount,
            `Blk. ${payment.block} Lot ${payment.lot}`
          );
          observer.next(response);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  // Update payment status
  updatePaymentStatus(paymentId: number, paymentData: { status: string; date: string; unit: string; resident_name: string; amount: number }): Observable<ApiResponse<null>> {
    const formData = new FormData();
    formData.append('payment_id', paymentId.toString());
    formData.append('status', paymentData.status);
    formData.append('date', paymentData.date);
    formData.append('unit', paymentData.unit);
    formData.append('resident_name', paymentData.resident_name);
    formData.append('amount', paymentData.amount.toString());

    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/post.php`, formData, {
      params: { action: 'updatePaymentStatus' }
    });
  }

  // Delete payment
  deletePayment(payment_id: number): Observable<ApiResponse<null>> {
    const formData = new FormData();
    formData.append('payment_id', payment_id.toString());

    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/post.php`, formData, {
      params: { action: 'deletePayment' }
    });
  }

  // Get resident units
  getResidentUnits(): Observable<ApiResponse<{ unit: string, name: string }[]>> {
    return this.http.get<ApiResponse<{ unit: string, name: string }[]>>(`${this.apiUrl}/get.php`, {
      params: { action: 'getResidentUnits' }
    });
  }

  // Add to PaymentService class
  getPaymentTrends(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get.php`, {
      params: { action: 'getPaymentTrends' }
    });
  }

  // Get community stats with calculations
  getCommunityStats(): Observable<ApiResponse<CommunityStats>> {
    return new Observable(observer => {
      // First get resident units to check occupancy
      this.getResidentUnits().subscribe({
        next: (unitsResponse) => {
          // Count occupied units (units with resident names)
          const occupiedUnits = unitsResponse.data.filter(unit => unit.name && unit.name.trim() !== '').length;
          const totalUnits = unitsResponse.data.length;

          // Then get payment stats to calculate compliance
          this.getPaymentStats().subscribe({
            next: (statsResponse) => {
              const total = statsResponse.data.total_collections;
              const pending = statsResponse.data.pending_amount;
              const overdue = statsResponse.data.overdue_amount;

              // Calculate payment compliance percentage
              const totalExpected = total + pending + overdue;
              const compliancePercentage = totalExpected > 0 
                ? Math.round((total / totalExpected) * 100) 
                : 100;

              observer.next({
                status: 'success',
                message: 'Community stats retrieved successfully',
                data: {
                  total_units: totalUnits,
                  occupied_units: occupiedUnits,
                  payment_compliance: compliancePercentage
                }
              });
              observer.complete();
            },
            error: (error) => observer.error(error)
          });
        },
        error: (error) => observer.error(error)
      });
    });
  }
}