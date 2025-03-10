import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserduesComponent } from './userdues.component';

describe('UserduesComponent', () => {
  let component: UserduesComponent;
  let fixture: ComponentFixture<UserduesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserduesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserduesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
