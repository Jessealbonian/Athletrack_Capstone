import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ResidentsService, Resident } from './residents.service';
import { environment } from '../../../environments/environment';

describe('ResidentsService', () => {
  let service: ResidentsService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/modules`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ResidentsService]
    });
    service = TestBed.inject(ResidentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get residents', () => {
    const mockResidents = {
      status: 'success',
      message: 'Successfully retrieved residents.',
      data: [
        {
          resident_id: 1,
          unit: 'Block 1 Lot 1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          status: 'Active',
          move_in_date: '2024-01-01'
        }
      ]
    };

    service.getResidents().subscribe(response => {
      expect(response).toEqual(mockResidents);
    });

    const req = httpMock.expectOne(`${apiUrl}/get.php?action=getResidents`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResidents);
  });

  it('should get resident stats', () => {
    const mockStats = {
      status: 'success',
      message: 'Successfully retrieved resident statistics.',
      data: {
        total: 10,
        active: 7,
        pending: 3
      }
    };

    service.getResidentStats().subscribe(response => {
      expect(response).toEqual(mockStats);
    });

    const req = httpMock.expectOne(`${apiUrl}/get.php?action=getResidentStats`);
    expect(req.request.method).toBe('GET');
    req.flush(mockStats);
  });

  it('should add a resident', () => {
    const mockResident: Resident = {
      unit: 'Block 1 Lot 2',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '0987654321',
      status: 'Pending',
      move_in_date: '2024-02-01'
    };

    const mockResponse = {
      status: 'success',
      message: 'Successfully added new resident.',
      data: null
    };

    service.addResident(mockResident).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/post.php?action=addResident`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTruthy();
    req.flush(mockResponse);
  });

  it('should update resident status', () => {
    const mockResponse = {
      status: 'success',
      message: 'Successfully updated resident status.',
      data: null
    };

    service.updateResidentStatus(1, 'Active').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/post.php?action=updateResidentStatus`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTruthy();
    req.flush(mockResponse);
  });

  it('should delete a resident', () => {
    const mockResponse = {
      status: 'success',
      message: 'Successfully deleted resident.',
      data: null
    };

    service.deleteResident(1).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${apiUrl}/post.php?action=deleteResident`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTruthy();
    req.flush(mockResponse);
  });
}); 