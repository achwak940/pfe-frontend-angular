import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnqueteDetailsComponent } from './enquete-details.component';

describe('EnqueteDetailsComponent', () => {
  let component: EnqueteDetailsComponent;
  let fixture: ComponentFixture<EnqueteDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EnqueteDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnqueteDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
