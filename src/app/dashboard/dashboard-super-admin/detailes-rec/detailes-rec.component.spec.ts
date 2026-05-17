import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailesRecComponent } from './detailes-rec.component';

describe('DetailesRecComponent', () => {
  let component: DetailesRecComponent;
  let fixture: ComponentFixture<DetailesRecComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailesRecComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetailesRecComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
