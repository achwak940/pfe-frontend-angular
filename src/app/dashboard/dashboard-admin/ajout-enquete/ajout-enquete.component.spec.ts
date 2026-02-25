import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AjoutEnqueteComponent } from './ajout-enquete.component';

describe('AjoutEnqueteComponent', () => {
  let component: AjoutEnqueteComponent;
  let fixture: ComponentFixture<AjoutEnqueteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AjoutEnqueteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AjoutEnqueteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
