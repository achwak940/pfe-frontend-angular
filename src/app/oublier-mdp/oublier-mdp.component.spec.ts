import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OublierMdpComponent } from './oublier-mdp.component';

describe('OublierMdpComponent', () => {
  let component: OublierMdpComponent;
  let fixture: ComponentFixture<OublierMdpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OublierMdpComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OublierMdpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
