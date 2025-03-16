import { ComponentFixture, TestBed } from '@angular/core/testing';

import { taskComponent } from './task.component';

describe('taskComponent', () => {
  let component: taskComponent;
  let fixture: ComponentFixture<taskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [taskComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(taskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
