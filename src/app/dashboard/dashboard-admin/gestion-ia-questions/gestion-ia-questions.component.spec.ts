import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionIaQuestionsComponent } from './gestion-ia-questions.component';

describe('GestionIaQuestionsComponent', () => {
  let component: GestionIaQuestionsComponent;
  let fixture: ComponentFixture<GestionIaQuestionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GestionIaQuestionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionIaQuestionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
