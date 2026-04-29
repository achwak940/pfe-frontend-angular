import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GereRolesComponent } from './gere-roles.component';

describe('GereRolesComponent', () => {
  let component: GereRolesComponent;
  let fixture: ComponentFixture<GereRolesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GereRolesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GereRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
