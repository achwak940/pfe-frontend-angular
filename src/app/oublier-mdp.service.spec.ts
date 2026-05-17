import { TestBed } from '@angular/core/testing';

import { OublierMdpService } from './oublier-mdp.service';

describe('OublierMdpService', () => {
  let service: OublierMdpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OublierMdpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
