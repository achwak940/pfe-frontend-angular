import { TestBed } from '@angular/core/testing';

import { RecommandationService } from './recommandation.service';

describe('RecommandationService', () => {
  let service: RecommandationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecommandationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
