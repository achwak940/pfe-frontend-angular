import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YoloPredictComponent } from './yolo-predict.component';

describe('YoloPredictComponent', () => {
  let component: YoloPredictComponent;
  let fixture: ComponentFixture<YoloPredictComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ YoloPredictComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(YoloPredictComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
