import { TestBed } from '@angular/core/testing';

import { DashboardAdminService } from './dashboard-admin.service';

describe('DashboardAdminService', () => {
  let service: DashboardAdminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardAdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
