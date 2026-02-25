import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionEnquetesComponent } from './gestion-enquetes.component';

describe('GestionEnquetesComponent', () => {
  let component: GestionEnquetesComponent;
  let fixture: ComponentFixture<GestionEnquetesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GestionEnquetesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionEnquetesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
