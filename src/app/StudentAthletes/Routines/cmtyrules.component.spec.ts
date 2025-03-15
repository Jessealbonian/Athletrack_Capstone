import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CmtyrulesComponent } from './cmtyrules.component';

describe('CmtyrulesComponent', () => {
  let component: CmtyrulesComponent;
  let fixture: ComponentFixture<CmtyrulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CmtyrulesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CmtyrulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
