import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CmntyeventsComponent } from './cmntyevents.component';

describe('CmntyeventsComponent', () => {
  let component: CmntyeventsComponent;
  let fixture: ComponentFixture<CmntyeventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CmntyeventsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CmntyeventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
