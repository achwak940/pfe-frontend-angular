import { TestBed } from '@angular/core/testing';

import { ReclmationsService } from './reclmations.service';

describe('ReclmationsService', () => {
  let service: ReclmationsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReclmationsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
