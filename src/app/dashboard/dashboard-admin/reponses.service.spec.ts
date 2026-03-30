import { TestBed } from '@angular/core/testing';

import { ReponsesService } from './reponses.service';

describe('ReponsesService', () => {
  let service: ReponsesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReponsesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
