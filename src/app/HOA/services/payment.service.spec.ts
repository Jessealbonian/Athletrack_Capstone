import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentService, Payment, PaymentStats } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaymentService]
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all payments', () => {
    const mockPayments: Payment[] = [
      {
        payment_id: 1,
        date: '2024-03-15',
        unit: 'Block 1 Lot 2',
        resident_name: 'John Doe',
        amount: 5000,
        status: 'Paid'
      }
    ];

    service.getPayments().subscribe(payments => {
      expect(payments).toEqual(mockPayments);
    });

    const req = httpMock.expectOne(`${service['apiUrl']}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPayments);
  });

  it('should get payment stats', () => {
    const mockStats: PaymentStats = {
      total_collections: 10000,
      pending_amount: 2000,
      overdue_amount: 1000
    };

    service.getPaymentStats().subscribe(stats => {
      expect(stats).toEqual(mockStats);
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/stats`);
    expect(req.request.method).toBe('GET');
    req.flush(mockStats);
  });

  it('should create a new payment', () => {
    const newPayment: Payment = {
      date: '2024-03-15',
      unit: 'Block 1 Lot 2',
      resident_name: 'John Doe',
      amount: 5000,
      status: 'Pending'
    };

    service.createPayment(newPayment).subscribe(payment => {
      expect(payment).toEqual({...newPayment, payment_id: 1});
    });

    const req = httpMock.expectOne(`${service['apiUrl']}`);
    expect(req.request.method).toBe('POST');
    req.flush({...newPayment, payment_id: 1});
  });

  it('should delete a payment', () => {
    const paymentId = 1;

    service.deletePayment(paymentId).subscribe();

    const req = httpMock.expectOne(`${service['apiUrl']}/${paymentId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should search payments', () => {
    const query = 'John';
    const mockResults: Payment[] = [
      {
        payment_id: 1,
        date: '2024-03-15',
        unit: 'Block 1 Lot 2',
        resident_name: 'John Doe',
        amount: 5000,
        status: 'Paid'
      }
    ];

    service.searchPayments(query).subscribe(results => {
      expect(results).toEqual(mockResults);
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/search?q=${query}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResults);
  });

  it('should filter payments by status', () => {
    const status = 'Paid';
    const mockResults: Payment[] = [
      {
        payment_id: 1,
        date: '2024-03-15',
        unit: 'Block 1 Lot 2',
        resident_name: 'John Doe',
        amount: 5000,
        status: 'Paid'
      }
    ];

    service.filterByStatus(status as 'Paid' | 'Pending' | 'Overdue').subscribe(results => {
      expect(results).toEqual(mockResults);
    });

    const req = httpMock.expectOne(`${service['apiUrl']}/filter?status=${status}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResults);
  });
});
