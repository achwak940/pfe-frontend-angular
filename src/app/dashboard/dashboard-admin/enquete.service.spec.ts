import { TestBed } from '@angular/core/testing';

import { EnqueteService } from './enquete.service';

describe('EnqueteService', () => {
  let service: EnqueteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EnqueteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
