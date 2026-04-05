import { TestBed } from '@angular/core/testing';

import { StatistiqueUserTotalService } from './statistique-user-total.service';

describe('StatistiqueUserTotalService', () => {
  let service: StatistiqueUserTotalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatistiqueUserTotalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
