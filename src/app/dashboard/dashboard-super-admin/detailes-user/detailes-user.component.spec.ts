import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailesUserComponent } from './detailes-user.component';

describe('DetailesUserComponent', () => {
  let component: DetailesUserComponent;
  let fixture: ComponentFixture<DetailesUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailesUserComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailesUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
