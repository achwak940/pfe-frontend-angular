import { TestBed } from '@angular/core/testing';

import { GereProfilService } from './gere-profil.service';

describe('GereProfilService', () => {
  let service: GereProfilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GereProfilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
