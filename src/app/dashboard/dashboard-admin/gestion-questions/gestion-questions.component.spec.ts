import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionQuestionsComponent } from './gestion-questions.component';

describe('GestionQuestionsComponent', () => {
  let component: GestionQuestionsComponent;
  let fixture: ComponentFixture<GestionQuestionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GestionQuestionsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestionQuestionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
