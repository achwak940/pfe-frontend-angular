import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyseReportingComponent } from './analyse-reporting.component';

describe('AnalyseReportingComponent', () => {
  let component: AnalyseReportingComponent;
  let fixture: ComponentFixture<AnalyseReportingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnalyseReportingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalyseReportingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
