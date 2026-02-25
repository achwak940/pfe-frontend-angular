import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModifierEnqueteComponent } from './modifier-enquete.component';

describe('ModifierEnqueteComponent', () => {
  let component: ModifierEnqueteComponent;
  let fixture: ComponentFixture<ModifierEnqueteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModifierEnqueteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModifierEnqueteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
