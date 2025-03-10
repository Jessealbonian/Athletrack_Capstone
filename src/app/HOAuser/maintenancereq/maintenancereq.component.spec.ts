import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaintenancereqComponent } from './maintenancereq.component';

describe('MaintenancereqComponent', () => {
  let component: MaintenancereqComponent;
  let fixture: ComponentFixture<MaintenancereqComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaintenancereqComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MaintenancereqComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
