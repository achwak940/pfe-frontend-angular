import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoiteMessangerComponent } from './boite-messanger.component';

describe('BoiteMessangerComponent', () => {
  let component: BoiteMessangerComponent;
  let fixture: ComponentFixture<BoiteMessangerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BoiteMessangerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoiteMessangerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
