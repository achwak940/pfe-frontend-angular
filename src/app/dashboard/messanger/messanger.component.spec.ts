import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessangerComponent } from './messanger.component';

describe('MessangerComponent', () => {
  let component: MessangerComponent;
  let fixture: ComponentFixture<MessangerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessangerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessangerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
