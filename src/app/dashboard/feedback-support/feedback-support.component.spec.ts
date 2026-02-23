import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackSupportComponent } from './feedback-support.component';

describe('FeedbackSupportComponent', () => {
  let component: FeedbackSupportComponent;
  let fixture: ComponentFixture<FeedbackSupportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FeedbackSupportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeedbackSupportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
