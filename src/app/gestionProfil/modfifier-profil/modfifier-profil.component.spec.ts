import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModfifierProfilComponent } from './modfifier-profil.component';

describe('ModfifierProfilComponent', () => {
  let component: ModfifierProfilComponent;
  let fixture: ComponentFixture<ModfifierProfilComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModfifierProfilComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModfifierProfilComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
