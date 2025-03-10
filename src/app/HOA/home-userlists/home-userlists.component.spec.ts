import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeUserlistsComponent } from './home-userlists.component';

describe('HomeUserlistsComponent', () => {
  let component: HomeUserlistsComponent;
  let fixture: ComponentFixture<HomeUserlistsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeUserlistsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeUserlistsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
