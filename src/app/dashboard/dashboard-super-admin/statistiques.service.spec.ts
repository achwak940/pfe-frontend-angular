import { TestBed } from '@angular/core/testing';

import { StatistiquesService } from './statistiques.service';

describe('StatistiquesService', () => {
  let service: StatistiquesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatistiquesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
