import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiQuestionComponent } from './ai-question.component';

describe('AiQuestionComponent', () => {
  let component: AiQuestionComponent;
  let fixture: ComponentFixture<AiQuestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AiQuestionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
